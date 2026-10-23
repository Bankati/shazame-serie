import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ensureAccount } from "@/server/auth/profile";
import type { ProviderSubscription } from "@/server/billing/billing-provider";
import { getEntitlement } from "@/server/billing/entitlement";
import { applyBillingEvent, loadSubscription } from "@/server/billing/subscriptions";
import { getDb } from "@/server/db/client";

import { adminSql, secretClient } from "./helpers";

// Critères de fin de U22 côté base : webhook rejoué → aucun doublon ni changement ; résiliation → Premium
// jusqu'à la fin de la période payée ; statut Premium écrit seulement par applyBillingEvent (invariant 5).
const sql = adminSql();
const db = getDb();
const admin = secretClient();
const PREFIX = `test-billing-${Date.now()}`;
const users: string[] = [];
const DAY_MS = 24 * 60 * 60 * 1000;

async function createAccount(label: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({
    email: `${PREFIX}-${label}@example.com`,
    password: "motdepasse-test",
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("utilisateur non créé");
  await ensureAccount(db, { userId: data.user.id, displayName: label });
  users.push(data.user.id);
  return data.user.id;
}

function remote(userId: string, overrides: Partial<ProviderSubscription> = {}): ProviderSubscription {
  return {
    providerSubscriptionId: `${PREFIX}-sub-${userId}`,
    providerCustomerId: `${PREFIX}-cus-${userId}`,
    userId,
    plan: "monthly",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * DAY_MS),
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

function event(suffix: string) {
  return { id: `${PREFIX}-evt-${suffix}`, type: "customer.subscription.updated", subscriptionId: "sub" };
}

let alice = "";

beforeAll(async () => {
  alice = await createAccount("alice");
});

afterAll(async () => {
  await sql`delete from public.billing_events where provider_event_id like ${`${PREFIX}%`}`;
  for (const id of users) await admin.auth.admin.deleteUser(id);
  await sql.end();
});

describe("applyBillingEvent", () => {
  it("paiement → Premium ; le même événement rejoué ne change rien", async () => {
    expect(await getEntitlement(alice)).toBe("free");
    expect(await applyBillingEvent(db, event("1"), remote(alice), "stripe")).toBe("applied");
    expect(await getEntitlement(alice)).toBe("premium");

    // Rejeu avec un état différent (ce qui ne doit jamais arriver) : ignoré, rien n'est écrit.
    expect(await applyBillingEvent(db, event("1"), remote(alice, { status: "expired" }), "stripe")).toBe("duplicate");
    expect((await loadSubscription(db, alice))?.status).toBe("active");
    const rows = await sql<
      { count: string }[]
    >`select count(*) from public.billing_events where provider_event_id = ${event("1").id}`;
    expect(Number(rows[0]?.count)).toBe(1);
  });

  it("résiliation : Premium jusqu'à la fin de la période, puis gratuit", async () => {
    const end = new Date(Date.now() + 10 * DAY_MS);
    await applyBillingEvent(db, event("2"), remote(alice, { status: "canceled", currentPeriodEnd: end }), "stripe");
    expect(await getEntitlement(alice)).toBe("premium");
    expect(await getEntitlement(alice, new Date(end.getTime() + 1000))).toBe("free");
  });

  it("double paiement : un second abonnement ne remplace jamais celui qui court (signalé pour remboursement)", async () => {
    const before = await loadSubscription(db, alice);
    const other = remote(alice, { providerSubscriptionId: `${PREFIX}-sub-double`, plan: "yearly" });
    expect(await applyBillingEvent(db, event("5"), other, "stripe")).toBe("conflict");
    expect(await loadSubscription(db, alice)).toEqual(before);
  });

  it("premier paiement en cours (statut inconnu) ou abonnement sans compte : noté, rien n'est accordé", async () => {
    const bruno = await createAccount("bruno");
    expect(await applyBillingEvent(db, event("3"), remote(bruno, { status: null }), "stripe")).toBe("ignored");
    expect(await applyBillingEvent(db, event("4"), remote(bruno, { userId: null }), "stripe")).toBe("ignored");
    expect(await loadSubscription(db, bruno)).toBeNull();
    expect(await getEntitlement(bruno)).toBe("free");
  });
});
