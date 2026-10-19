import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ensureAccount, loadProfile } from "@/server/auth/profile";
import { getDb } from "@/server/db/client";
import { LEGAL_VERSIONS } from "@/shared/legal/versions";

import { adminSql, secretClient } from "./helpers";

// Profil et consentements créés ensemble à la première connexion (U04, décision 4).
const sql = adminSql();
const db = getDb();
const admin = secretClient();
const EMAIL = `test-profile-${Date.now()}@example.com`;
let userId = "";

beforeAll(async () => {
  const { data, error } = await admin.auth.admin.createUser({ email: EMAIL, password: "motdepasse-test", email_confirm: true });
  if (error || !data.user) throw error ?? new Error("utilisateur non créé");
  userId = data.user.id;
});

afterAll(async () => {
  if (userId) await admin.auth.admin.deleteUser(userId);
  await sql.end();
});

async function consentCount(id: string): Promise<number | undefined> {
  const rows = await sql<{ count: number }[]>`select count(*)::int as count from public.consents where user_id = ${id}`;
  return rows[0]?.count;
}

describe("ensureAccount", () => {
  it("crée le profil (rôle user, actif) et les consentements CGU + confidentialité dans la version en vigueur", async () => {
    expect(await ensureAccount(db, { userId, displayName: "  Ana   Diallo " })).toEqual({ created: true });

    expect(await loadProfile(db, userId)).toEqual({ displayName: "Ana Diallo", role: "user", status: "active", deletedAt: null });
    const consents = await sql`select kind, version, granted from public.consents where user_id = ${userId} order by kind`;
    expect(consents).toEqual([
      { kind: "terms", version: LEGAL_VERSIONS.terms, granted: true },
      { kind: "privacy", version: LEGAL_VERSIONS.privacy, granted: true },
    ]);
  });

  it("deuxième appel (connexion suivante) : rien n'est modifié ni dupliqué", async () => {
    expect(await ensureAccount(db, { userId, displayName: "Autre nom" })).toEqual({ created: false });
    expect((await loadProfile(db, userId))?.displayName).toBe("Ana Diallo");
    expect(await consentCount(userId)).toBe(2);
  });

  it("suppression du compte Auth : profil et consentements effacés en cascade", async () => {
    const { data, error } = await admin.auth.admin.createUser({ email: `x-${EMAIL}`, password: "motdepasse-test", email_confirm: true });
    if (error || !data.user) throw error ?? new Error("utilisateur non créé");
    const id = data.user.id;
    await ensureAccount(db, { userId: id, displayName: null });
    await admin.auth.admin.deleteUser(id);
    expect(await loadProfile(db, id)).toBeNull();
    expect(await consentCount(id)).toBe(0);
  });
});
