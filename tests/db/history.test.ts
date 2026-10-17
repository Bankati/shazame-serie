import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ensureAccount } from "@/server/auth/profile";
import { getDb } from "@/server/db/client";
import { HISTORY_LIMIT, listHistoryRows, purgeOldIdentifications } from "@/server/history/history";

import { adminSql, secretClient } from "./helpers";

// Critère de fin de U17 : un utilisateur ne voit que ses identifications. Plus RG11 (50 dernières, purge
// au-delà de 2 ans).
const sql = adminSql();
const db = getDb();
const admin = secretClient();
const PREFIX = `test-history-${Date.now()}`;
const users: string[] = [];

async function createAccount(label: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({ email: `${PREFIX}-${label}@example.com`, password: "motdepasse-test", email_confirm: true });
  if (error || !data.user) throw error ?? new Error("utilisateur non créé");
  await ensureAccount(db, { userId: data.user.id, displayName: label });
  users.push(data.user.id);
  return data.user.id;
}

async function insertIdentification(userId: string | null, values: { tmdbId: number | null; outcome: string; createdAt: string; visitor?: string }) {
  await sql`
    insert into public.identifications (user_id, visitor_key, fingerprint, tmdb_id, media_type, confidence, source, outcome, created_at)
    values (${userId}, ${values.visitor ?? null}, ${`${PREFIX}-${Math.random()}`}, ${values.tmdbId},
            ${values.tmdbId === null ? null : "movie"}, ${values.tmdbId === null ? null : 90}, 'ai', ${values.outcome}, ${values.createdAt})`;
}

let alice = "";
let bruno = "";

beforeAll(async () => {
  alice = await createAccount("alice");
  bruno = await createAccount("bruno");
  // Alice : 55 identifications réussies (une par minute), un échec, une identification de visiteur à part.
  for (let index = 0; index < 55; index++) {
    await insertIdentification(alice, { tmdbId: 1000 + index, outcome: "shown", createdAt: new Date(Date.UTC(2026, 9, 1, 12, index)).toISOString() });
  }
  await insertIdentification(alice, { tmdbId: null, outcome: "failed", createdAt: "2026-10-02T12:00:00Z" });
  await insertIdentification(bruno, { tmdbId: 2000, outcome: "shown", createdAt: "2026-10-03T12:00:00Z" });
});

afterAll(async () => {
  for (const id of users) await admin.auth.admin.deleteUser(id);
  await sql`delete from public.identifications where fingerprint like ${`${PREFIX}-%`}`;
  await sql.end();
});

describe("listHistoryRows", () => {
  it("ne renvoie que les identifications du compte demandé (critère de fin U17)", async () => {
    const aliceRows = await listHistoryRows(db, alice);
    const brunoRows = await listHistoryRows(db, bruno);
    expect(aliceRows.some((row) => row.tmdbId === 2000)).toBe(false);
    expect(brunoRows.map((row) => row.tmdbId)).toEqual([2000]);
  });

  it("les 50 dernières réussies, plus récentes d'abord, sans les échecs (RG11)", async () => {
    const rows = await listHistoryRows(db, alice);
    expect(rows).toHaveLength(HISTORY_LIMIT);
    expect(rows[0]?.tmdbId).toBe(1054);
    expect(rows.at(-1)?.tmdbId).toBe(1005);
    expect(rows.every((row) => row.tmdbId >= 1000)).toBe(true);
  });
});

describe("purgeOldIdentifications", () => {
  it("supprime les identifications de plus de 2 ans (comptes et visiteurs), garde les autres", async () => {
    const old = new Date(Date.now() - 2 * 365.25 * 24 * 3600 * 1000 - 86_400_000).toISOString();
    const recent = new Date(Date.now() - 700 * 24 * 3600 * 1000).toISOString();
    await insertIdentification(bruno, { tmdbId: 3001, outcome: "shown", createdAt: old });
    await insertIdentification(null, { tmdbId: 3002, outcome: "shown", createdAt: old, visitor: "visiteur-test" });
    await insertIdentification(bruno, { tmdbId: 3003, outcome: "shown", createdAt: recent });

    expect(await purgeOldIdentifications(db)).toBeGreaterThanOrEqual(2);
    const remaining = await sql<{ tmdb_id: number }[]>`
      select tmdb_id from public.identifications where tmdb_id in (3001, 3002, 3003) and fingerprint like ${`${PREFIX}-%`}`;
    expect(remaining.map((row) => row.tmdb_id)).toEqual([3003]);
  });
});
