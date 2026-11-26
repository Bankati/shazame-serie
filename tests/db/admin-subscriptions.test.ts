import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { syncSubscriptionFromProvider } from "@/server/admin/subscriptions-admin";
import { loadAdminUser } from "@/server/admin/users";
import { ensureAccount } from "@/server/auth/profile";
import type { ProviderSubscription } from "@/server/billing/billing-provider";
import { getEntitlement } from "@/server/billing/entitlement";
import { loadSubscription } from "@/server/billing/subscriptions";
import { getDb } from "@/server/db/client";

import { adminSql, secretClient } from "./helpers";

// Critère de fin de U26c : la correction d'un abonnement (relu chez le prestataire) écrit l'abonnement et sa
// ligne d'audit dans la même transaction (invariants 5 et 6) ; refus ou absence de changement : rien d'écrit ;
// échec du journal : abonnement inchangé.
const sql = adminSql();
const db = getDb();
const supabase = secretClient();
const PREFIX = `test-admin-subs-${Date.now()}`;
const DAY_MS = 24 * 60 * 60 * 1000;
const users: string[] = [];
let adminId = "";

async function createAccount(label: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email: `${PREFIX}-${label}@example.com`,
    password: "motdepasse-test",
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("utilisateur non créé");
  await ensureAccount(db, { userId: data.user.id, displayName: `${PREFIX}-${label}` });
  users.push(data.user.id);
  return data.user.id;
}

function remote(userId: string | null, overrides: Partial<ProviderSubscription> = {}): ProviderSubscription {
  return {
    providerSubscriptionId: `sub_${PREFIX}-${userId ?? "anonyme"}`,
    providerCustomerId: `cus_${PREFIX}-${userId ?? "anonyme"}`,
    userId,
    plan: "monthly",
    status: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * DAY_MS),
    cancelAtPeriodEnd: false,
    ...overrides,
  };
}

const auditOf = (userId: string) =>
  sql<{ action: string; target_type: string; before: Record<string, unknown>; after: Record<string, unknown> }[]>`
    select action, target_type, before, after from public.admin_audit_log where target_id = ${userId} order by created_at`;

beforeAll(async () => {
  adminId = await createAccount("admin");
  await sql`update public.profiles set role = 'admin' where id = ${adminId}`;
});

afterAll(async () => {
  await sql`delete from public.admin_audit_log where admin_id = ${adminId}`;
  for (const id of users) await supabase.auth.admin.deleteUser(id);
  await sql.end();
});

describe("syncSubscriptionFromProvider", () => {
  it("rattache un abonnement manqué par le webhook : Premium accordé, une ligne d'audit", async () => {
    const userId = await createAccount("manque");
    expect(await getEntitlement(userId)).toBe("free");
    const fetched = remote(userId);
    expect(await syncSubscriptionFromProvider(db, adminId, userId, fetched, "stripe")).toEqual({ ok: true, value: "changed" });
    expect(await loadSubscription(db, userId)).toMatchObject({ providerSubscriptionId: fetched.providerSubscriptionId, status: "active" });
    expect(await getEntitlement(userId)).toBe("premium");
    expect(await auditOf(userId)).toEqual([
      expect.objectContaining({
        action: "subscription.sync",
        target_type: "subscription",
        after: expect.objectContaining({ status: "active", providerSubscriptionId: fetched.providerSubscriptionId }),
      }),
    ]);
  });

  it("ne journalise que les champs modifiés, et rien quand la base est déjà à jour", async () => {
    const userId = await createAccount("maj");
    const fetched = remote(userId);
    await syncSubscriptionFromProvider(db, adminId, userId, fetched, "stripe");
    expect(await syncSubscriptionFromProvider(db, adminId, userId, fetched, "stripe")).toEqual({ ok: true, value: "unchanged" });
    expect(await auditOf(userId)).toHaveLength(1);

    await syncSubscriptionFromProvider(db, adminId, userId, { ...fetched, cancelAtPeriodEnd: true }, "stripe");
    const rows = await auditOf(userId);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ before: { cancelAtPeriodEnd: false }, after: { cancelAtPeriodEnd: true } });
  });

  it("refuse sans rien écrire : abonnement d'un autre compte, inexploitable, doublon en cours, compte absent", async () => {
    const userId = await createAccount("refus");
    const other = await createAccount("autre");
    expect(await syncSubscriptionFromProvider(db, adminId, userId, remote(other), "stripe")).toEqual({ ok: false, error: "other_account" });
    expect(await syncSubscriptionFromProvider(db, adminId, userId, remote(userId, { status: null }), "stripe")).toEqual({ ok: false, error: "not_usable" });
    expect(await loadSubscription(db, userId)).toBeNull();

    await syncSubscriptionFromProvider(db, adminId, userId, remote(userId), "stripe");
    const duplicate = remote(userId, { providerSubscriptionId: `sub_${PREFIX}-doublon` });
    expect(await syncSubscriptionFromProvider(db, adminId, userId, duplicate, "stripe")).toEqual({ ok: false, error: "conflict" });
    expect(await auditOf(userId)).toHaveLength(1);

    const ghost = randomUUID();
    expect(await syncSubscriptionFromProvider(db, adminId, ghost, remote(null), "stripe")).toEqual({ ok: false, error: "not_found" });
    expect(await auditOf(ghost)).toHaveLength(0);
  });

  it("annule l'écriture de l'abonnement si le journal ne peut pas être écrit", async () => {
    const userId = await createAccount("retour-arriere");
    // Administrateur inexistant : la clé étrangère du journal échoue, l'abonnement ne doit pas être écrit.
    await expect(syncSubscriptionFromProvider(db, randomUUID(), userId, remote(userId), "stripe")).rejects.toThrow();
    expect(await loadSubscription(db, userId)).toBeNull();
    expect(await getEntitlement(userId)).toBe("free");
  });
});

describe("loadAdminUser", () => {
  it("renvoie la fiche d'un compte, null pour un compte inconnu", async () => {
    const userId = await createAccount("fiche");
    expect(await loadAdminUser(db, userId)).toMatchObject({ id: userId, email: `${PREFIX}-fiche@example.com`, status: "active" });
    expect(await loadAdminUser(db, randomUUID())).toBeNull();
  });
});
