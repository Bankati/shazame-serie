import { describe, expect, it, vi } from "vitest";

import type { Account } from "@/server/auth/guards";

import { type BillingProvider, InvalidSignatureError, type ProviderSubscription } from "./billing-provider";
import {
  type BillingDeps,
  handleBillingWebhook,
  loadSubscriptionPage,
  openPortal,
  startCheckout,
} from "./billing-requests";
import { isPremium } from "./entitlement";
import type { SubscriptionRow } from "./subscriptions";

vi.mock("@/server/env", () => ({ env: {} }));
vi.mock("@/lib/site-url", () => ({ siteUrl: () => "https://site.example" }));

const NOW = new Date("2026-10-23T10:00:00Z");
const LATER = new Date("2026-11-23T10:00:00Z");
const EARLIER = new Date("2026-09-23T10:00:00Z");
const ACCOUNT: Account = {
  id: "8b1f3c1e-0000-4000-8000-000000000001",
  email: "a@example.com",
  displayName: null,
  role: "user",
  status: "active",
};
const ROW: SubscriptionRow = {
  providerCustomerId: "cus_1",
  providerSubscriptionId: "sub_1",
  plan: "monthly",
  status: "active",
  currentPeriodEnd: LATER,
  cancelAtPeriodEnd: false,
};
const REMOTE: ProviderSubscription = { ...ROW, userId: ACCOUNT.id };

function provider(overrides: Partial<BillingProvider> = {}): BillingProvider {
  return {
    createCheckout: vi.fn(async () => "https://checkout.stripe.com/c/pay/cs_test_1"),
    createPortalSession: vi.fn(async () => "https://billing.stripe.com/p/session/test_1"),
    parseWebhook: vi.fn(() => ({ id: "evt_1", type: "customer.subscription.updated", subscriptionId: "sub_1" })),
    getSubscription: vi.fn(async () => REMOTE),
    listInvoices: vi.fn(async () => []),
    ...overrides,
  };
}

function deps(overrides: Partial<BillingDeps> = {}, billing: BillingProvider = provider()): BillingDeps {
  return {
    configured: () => true,
    provider: () => billing,
    account: async () => ACCOUNT,
    subscription: async () => null,
    apply: vi.fn(async () => "applied" as const),
    allowCheckout: async () => true,
    now: () => NOW,
    ...overrides,
  };
}

function form(plan: string): FormData {
  const data = new FormData();
  data.set("plan", plan);
  return data;
}

function webhook(signature: string | null = "t=1,v1=abc"): Request {
  return new Request("https://site.example/api/billing/webhook", {
    method: "POST",
    headers: signature ? { "stripe-signature": signature } : {},
    body: '{"id":"evt_1"}',
  });
}

describe("isPremium (RG13, RG14)", () => {
  it.each([
    ["active", LATER, true],
    ["active", EARLIER, true],
    ["past_due", LATER, true],
    ["past_due", EARLIER, false],
    ["canceled", LATER, true],
    ["canceled", EARLIER, false],
    ["expired", LATER, false],
  ] as const)("%s jusqu'au %s → %s", (status, currentPeriodEnd, expected) => {
    expect(isPremium({ status, currentPeriodEnd }, NOW)).toBe(expected);
  });

  it("aucun abonnement → gratuit", () => {
    expect(isPremium(null, NOW)).toBe(false);
  });
});

describe("startCheckout", () => {
  it("compte gratuit : page de paiement, compte posé dans les métadonnées, retour sur la page d'abonnement", async () => {
    const billing = provider();
    expect(await startCheckout(form("yearly"), deps({}, billing))).toEqual({
      to: "https://checkout.stripe.com/c/pay/cs_test_1",
    });
    expect(billing.createCheckout).toHaveBeenCalledWith({
      userId: ACCOUNT.id,
      email: ACCOUNT.email,
      plan: "yearly",
      customerId: null,
      successUrl: "https://site.example/compte/abonnement?statut=merci",
      cancelUrl: "https://site.example/tarifs",
    });
  });

  it("ancien abonné (abonnement terminé) : même client Stripe", async () => {
    const billing = provider();
    await startCheckout(
      form("monthly"),
      deps({ subscription: async () => ({ ...ROW, status: "expired", currentPeriodEnd: EARLIER }) }, billing),
    );
    expect(billing.createCheckout).toHaveBeenCalledWith(expect.objectContaining({ customerId: "cus_1" }));
  });

  it("déjà Premium : pas de second abonnement, page de l'abonnement", async () => {
    const billing = provider();
    expect(await startCheckout(form("monthly"), deps({ subscription: async () => ROW }, billing))).toEqual({
      to: "/compte/abonnement",
    });
    expect(billing.createCheckout).not.toHaveBeenCalled();
  });

  it("visiteur → inscription puis retour aux tarifs ; suspendu → refusé ; formule inconnue ou paiement non configuré → indisponible", async () => {
    expect(await startCheckout(form("monthly"), deps({ account: async () => null }))).toEqual({
      to: "/inscription?suite=%2Ftarifs",
    });
    expect(
      await startCheckout(form("monthly"), deps({ account: async () => ({ ...ACCOUNT, status: "suspended" }) })),
    ).toEqual({ to: "/tarifs?paiement=refuse" });
    expect(await startCheckout(form("lifetime"), deps())).toEqual({ to: "/tarifs?paiement=indisponible" });
    expect(await startCheckout(form("monthly"), deps({ configured: () => false }))).toEqual({
      to: "/tarifs?paiement=indisponible",
    });
  });

  it("trop de tentatives → refusé ; Stripe en panne → indisponible", async () => {
    expect(await startCheckout(form("monthly"), deps({ allowCheckout: async () => false }))).toEqual({
      to: "/tarifs?paiement=trop",
    });
    const failing = provider({ createCheckout: vi.fn(async () => Promise.reject(new Error("réseau"))) });
    expect(await startCheckout(form("monthly"), deps({}, failing))).toEqual({ to: "/tarifs?paiement=indisponible" });
  });
});

describe("openPortal", () => {
  it("abonné : portail Stripe avec retour sur la page d'abonnement ; sans abonnement → tarifs ; visiteur → connexion", async () => {
    const billing = provider();
    expect(await openPortal(deps({ subscription: async () => ROW }, billing))).toEqual({
      to: "https://billing.stripe.com/p/session/test_1",
    });
    expect(billing.createPortalSession).toHaveBeenCalledWith({
      customerId: "cus_1",
      returnUrl: "https://site.example/compte/abonnement",
    });
    expect(await openPortal(deps())).toEqual({ to: "/tarifs" });
    expect(await openPortal(deps({ account: async () => null }))).toEqual({
      to: "/connexion?suite=%2Fcompte%2Fabonnement",
    });
  });
});

describe("handleBillingWebhook", () => {
  it("signature valide : abonnement relu chez Stripe puis enregistré", async () => {
    const billing = provider();
    const dependencies = deps({}, billing);
    const response = await handleBillingWebhook(webhook(), dependencies);
    expect(response.status).toBe(200);
    expect(billing.parseWebhook).toHaveBeenCalledWith('{"id":"evt_1"}', "t=1,v1=abc");
    expect(dependencies.apply).toHaveBeenCalledWith(
      { id: "evt_1", type: "customer.subscription.updated", subscriptionId: "sub_1" },
      REMOTE,
    );
  });

  it("signature invalide → 400, rien n'est enregistré", async () => {
    const billing = provider({
      parseWebhook: vi.fn(() => {
        throw new InvalidSignatureError();
      }),
    });
    const dependencies = deps({}, billing);
    expect((await handleBillingWebhook(webhook("t=1,v1=faux"), dependencies)).status).toBe(400);
    expect(dependencies.apply).not.toHaveBeenCalled();
  });

  it("second abonnement pendant qu'un autre court → 200 (pas de nouvel essai), à traiter à la main", async () => {
    const response = await handleBillingWebhook(webhook(), deps({ apply: vi.fn(async () => "conflict" as const) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { received: true, outcome: "conflict" } });
  });

  it("événement rejoué → 200 sans nouvelle écriture (l'idempotence est tenue par la base)", async () => {
    const response = await handleBillingWebhook(webhook(), deps({ apply: vi.fn(async () => "duplicate" as const) }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, data: { received: true, outcome: "duplicate" } });
  });

  it("événement sans abonnement → 200 sans lecture ; Stripe ou base injoignable → erreur pour que Stripe réessaie", async () => {
    const quiet = provider({
      parseWebhook: vi.fn(() => ({ id: "evt_2", type: "charge.succeeded", subscriptionId: null })),
    });
    expect((await handleBillingWebhook(webhook(), deps({}, quiet))).status).toBe(200);
    expect(quiet.getSubscription).not.toHaveBeenCalled();

    const down = provider({ getSubscription: vi.fn(async () => Promise.reject(new Error("réseau"))) });
    expect((await handleBillingWebhook(webhook(), deps({}, down))).status).toBe(502);
    expect(
      (await handleBillingWebhook(webhook(), deps({ apply: vi.fn(async () => Promise.reject(new Error("base"))) })))
        .status,
    ).toBe(502);
  });

  it("paiement non configuré → erreur, rien n'est lu", async () => {
    const billing = provider();
    expect((await handleBillingWebhook(webhook(), deps({ configured: () => false }, billing))).status).toBe(502);
    expect(billing.parseWebhook).not.toHaveBeenCalled();
  });
});

describe("loadSubscriptionPage", () => {
  it("factures indisponibles : le reste de la page s'affiche", async () => {
    const billing = provider({ listInvoices: vi.fn(async () => Promise.reject(new Error("réseau"))) });
    expect(await loadSubscriptionPage(ACCOUNT.id, deps({ subscription: async () => ROW }, billing))).toEqual({
      subscription: ROW,
      premium: true,
      invoices: null,
      configured: true,
    });
  });
});
