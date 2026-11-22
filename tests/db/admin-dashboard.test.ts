import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadAdminDashboard } from "@/server/admin/dashboard";
import { ensureAccount } from "@/server/auth/profile";
import { getDb } from "@/server/db/client";

import { adminSql, secretClient } from "./helpers";

// Critère de fin de U25 : chiffres du tableau de bord cohérents avec des données de test. Les données sont datées
// en 2099 (période vide ailleurs) ; les comptes et abonnements, partagés avec le reste de la base, sont mesurés
// par différence.
const sql = adminSql();
const db = getDb();
const admin = secretClient();
const PREFIX = `test-admin-dash-${Date.now()}`;
const users: string[] = [];
// 15 juin 2099, 12 h à Paris (heure d'été, UTC+2) : période du 17 mai au 15 juin.
const NOW = new Date("2099-06-15T10:00:00Z");

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

async function addIdentification(createdAt: string, fields: { outcome: string; counted: boolean; source: string }) {
  await sql`
    insert into public.identifications (visitor_key, fingerprint, source, outcome, counted, created_at)
    values (${PREFIX}, ${`${PREFIX}-${createdAt}-${Math.random()}`}, ${fields.source}::identification_source,
      ${fields.outcome}::identification_outcome, ${fields.counted}, ${createdAt}::timestamptz)`;
}

let before: Awaited<ReturnType<typeof loadAdminDashboard>>;

beforeAll(async () => {
  before = await loadAdminDashboard(db, NOW);

  const [monthly, yearly, expired] = [await createAccount("m"), await createAccount("y"), await createAccount("x")];
  await sql`update public.profiles set created_at = '2099-06-01T08:00:00Z' where id in ${sql([monthly, yearly])}`;
  const subscription = (userId: string, plan: string, status: string, end: string) => sql`
    insert into public.subscriptions (user_id, provider, provider_customer_id, provider_subscription_id, plan, status, current_period_end)
    values (${userId}, 'stripe', ${`${PREFIX}-cus-${userId}`}, ${`${PREFIX}-sub-${userId}`},
      ${plan}::subscription_plan, ${status}::subscription_status, ${end}::timestamptz)`;
  await subscription(monthly, "monthly", "active", "2099-07-01T00:00:00Z");
  // Résilié mais période payée en cours : encore Premium.
  await subscription(yearly, "yearly", "canceled", "2099-12-01T00:00:00Z");
  // Résilié et période finie : plus Premium.
  await subscription(expired, "monthly", "canceled", "2099-06-01T00:00:00Z");

  // 15 juin à 0 h 30 (Paris) : compte pour le 15, pas pour le 14.
  await addIdentification("2099-06-14T22:30:00Z", { outcome: "shown", counted: true, source: "ai" });
  await addIdentification("2099-06-15T09:00:00Z", { outcome: "shown", counted: false, source: "cache" });
  await addIdentification("2099-06-15T09:30:00Z", { outcome: "low_confidence", counted: false, source: "ai" });
  await addIdentification("2099-06-10T12:00:00Z", { outcome: "failed", counted: false, source: "ai" });
  // 16 mai à 23 h 59 (Paris) : la veille du premier jour, hors période.
  await addIdentification("2099-05-16T21:59:00Z", { outcome: "shown", counted: true, source: "ai" });

  await sql`insert into public.ai_spend_daily (day, total_micro_eur, calls) values ('2099-06-15', 4000, 2), ('2099-06-10', 1000, 1)
    on conflict (day) do update set total_micro_eur = excluded.total_micro_eur, calls = excluded.calls`;
});

afterAll(async () => {
  await sql`delete from public.identifications where visitor_key = ${PREFIX}`;
  await sql`delete from public.ai_spend_daily where day in ('2099-06-15', '2099-06-10')`;
  for (const id of users) await admin.auth.admin.deleteUser(id);
  await sql.end();
});

describe("loadAdminDashboard", () => {
  it("utilisateurs : total et nouveaux de la période", async () => {
    const after = await loadAdminDashboard(db, NOW);
    expect(after.users.total - before.users.total).toBe(3);
    expect(after.users.newInPeriod - before.users.newInPeriod).toBe(2);
  });

  it("Premium selon la règle du droit, revenu mensuel estimé", async () => {
    const after = await loadAdminDashboard(db, NOW);
    expect(after.premium.monthly - before.premium.monthly).toBe(1);
    expect(after.premium.yearly - before.premium.yearly).toBe(1);
    expect(after.premium.estimatedMrrCents - before.premium.estimatedMrrCents).toBe(299 + 208);
  });

  it("identifications par jour de Paris, taux de réussite, coût IA", async () => {
    const after = await loadAdminDashboard(db, NOW);
    expect(after.days).toHaveLength(30);
    expect(after.days[0]).toBe("2099-05-17");
    expect(after.today).toMatchObject({
      day: "2099-06-15",
      identifications: 3,
      shown: 2,
      counted: 1,
      fromCache: 1,
      aiCostMicroEur: 4_000,
      aiCalls: 2,
    });
    expect(after.activity[0]?.day).toBe("2099-06-15");
    expect(after.activity.find((row) => row.day === "2099-06-14")?.identifications).toBe(0);
    expect(after.totals).toMatchObject({
      identifications: 4,
      shown: 2,
      counted: 1,
      fromCache: 1,
      aiCostMicroEur: 5_000,
      successRate: 50,
      cacheShare: 25,
    });
    expect(after.today.aiDailyCapMicroEur).toBeGreaterThanOrEqual(0);
  });
});
