import Stripe from "stripe";
import { describe, expect, it, vi } from "vitest";

import { InvalidSignatureError } from "../billing-provider";
import { createStripeBilling, normalizeStatus, toProviderSubscription } from "./stripe-billing";

vi.mock("@/server/env", () => ({ env: {} }));

// Valeurs inventées : aucune clé réelle, aucun appel réseau (la vérification de signature est locale).
const SECRET = "whsec_testsecretpourlestestsunitaires";
const PRICES = { monthly: "price_mensuel123", yearly: "price_annuel456" };
const billing = createStripeBilling({
  secretKey: "sk_test_cleinventeepourlestests000",
  webhookSecret: SECRET,
  prices: PRICES,
});

function signed(payload: object, secret = SECRET) {
  const body = JSON.stringify(payload);
  return { body, signature: Stripe.webhooks.generateTestHeaderString({ payload: body, secret }) };
}

function subscription(overrides: Record<string, unknown> = {}): Stripe.Subscription {
  return {
    id: "sub_1",
    object: "subscription",
    customer: "cus_1",
    status: "active",
    metadata: { userId: "8b1f3c1e-0000-4000-8000-000000000001" },
    cancel_at_period_end: false,
    cancel_at: null,
    items: {
      data: [
        { price: { id: PRICES.yearly }, current_period_end: 1_800_000_000 },
        { price: { id: "price_autre" }, current_period_end: 1_700_000_000 },
      ],
    },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("normalizeStatus", () => {
  it.each([
    ["active", "active"],
    ["trialing", "active"],
    ["past_due", "past_due"],
    ["unpaid", "past_due"],
    ["canceled", "canceled"],
    ["incomplete_expired", "expired"],
    ["incomplete", null],
  ])("%s → %s", (status, expected) => {
    expect(normalizeStatus(status)).toBe(expected);
  });
});

describe("toProviderSubscription", () => {
  it("formule, compte, fin de période la plus lointaine des lignes", () => {
    expect(toProviderSubscription(subscription(), PRICES)).toEqual({
      providerSubscriptionId: "sub_1",
      providerCustomerId: "cus_1",
      userId: "8b1f3c1e-0000-4000-8000-000000000001",
      plan: "yearly",
      status: "active",
      currentPeriodEnd: new Date(1_800_000_000 * 1000),
      cancelAtPeriodEnd: false,
    });
  });

  it("résiliation programmée (cancel_at) ; prix inconnu → aucune formule ; sans compte → null", () => {
    const result = toProviderSubscription(
      subscription({
        cancel_at: 1_800_000_000,
        metadata: {},
        items: { data: [{ price: { id: "price_x" }, current_period_end: 1 }] },
      }),
      PRICES,
    );
    expect(result).toMatchObject({ cancelAtPeriodEnd: true, plan: null, userId: null });
  });
});

describe("parseWebhook", () => {
  it("signature valide : abonnement modifié → identifiant de l'abonnement", () => {
    const { body, signature } = signed({
      id: "evt_1",
      object: "event",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1", object: "subscription" } },
    });
    expect(billing.parseWebhook(body, signature)).toEqual({
      id: "evt_1",
      type: "customer.subscription.updated",
      subscriptionId: "sub_1",
    });
  });

  it("paiement terminé → abonnement de la session ; autre événement → rien à faire", () => {
    const done = signed({
      id: "evt_2",
      object: "event",
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", object: "checkout.session", subscription: "sub_9" } },
    });
    expect(billing.parseWebhook(done.body, done.signature).subscriptionId).toBe("sub_9");
    const other = signed({
      id: "evt_3",
      object: "event",
      type: "charge.succeeded",
      data: { object: { id: "ch_1", object: "charge" } },
    });
    expect(billing.parseWebhook(other.body, other.signature).subscriptionId).toBeNull();
  });

  it("signature absente, fausse ou corps modifié → InvalidSignatureError", () => {
    const { body, signature } = signed({
      id: "evt_4",
      object: "event",
      type: "customer.subscription.updated",
      data: { object: { id: "sub_1", object: "subscription" } },
    });
    expect(() => billing.parseWebhook(body, null)).toThrow(InvalidSignatureError);
    expect(() => billing.parseWebhook(body, signed({}, "whsec_unautresecretquelconque").signature)).toThrow(
      InvalidSignatureError,
    );
    expect(() => billing.parseWebhook(body.replace("sub_1", "sub_2"), signature)).toThrow(InvalidSignatureError);
  });
});
