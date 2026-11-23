import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { loadAuditLog } from "@/server/admin/audit";
import { updateSetting } from "@/server/admin/settings-admin";
import { searchUsers, setUserStatus } from "@/server/admin/users";
import { ensureAccount } from "@/server/auth/profile";
import { getDb } from "@/server/db/client";

import { adminSql, secretClient } from "./helpers";

// Critère de fin de U26 : chaque action admin écrit sa ligne d'audit dans la même transaction (invariant 6) ;
// une action refusée ou sans effet n'écrit rien ; un échec du journal annule la modification.
const sql = adminSql();
const db = getDb();
const supabase = secretClient();
const PREFIX = `test-admin-actions-${Date.now()}`;
const users: string[] = [];
let adminId = "";
let userId = "";
let otherAdminId = "";
let originalFreeQuota: unknown;

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

const auditRows = (targetId: string) =>
  sql<{ action: string; admin_id: string | null; before: unknown; after: unknown }[]>`
    select action, admin_id, before, after from public.admin_audit_log where target_id = ${targetId} order by created_at`;
const statusOf = async (id: string) => (await sql<{ status: string }[]>`select status from public.profiles where id = ${id}`)[0]?.status;

beforeAll(async () => {
  [adminId, userId, otherAdminId] = [await createAccount("admin"), await createAccount("user"), await createAccount("admin2")];
  await sql`update public.profiles set role = 'admin' where id in ${sql([adminId, otherAdminId])}`;
  originalFreeQuota = (await sql<{ value: unknown }[]>`select value from public.app_settings where key = 'free_daily_quota'`)[0]?.value;
});

afterAll(async () => {
  await sql`update public.app_settings set value = ${sql.json(originalFreeQuota as number)} where key = 'free_daily_quota'`;
  await sql`delete from public.admin_audit_log where admin_id in ${sql(users)}`;
  for (const id of users) await supabase.auth.admin.deleteUser(id);
  await sql.end();
});

describe("setUserStatus", () => {
  it("suspend puis réactive, avec une ligne d'audit par changement", async () => {
    expect(await setUserStatus(db, adminId, userId, "suspended")).toEqual({ ok: true, value: "changed" });
    expect(await statusOf(userId)).toBe("suspended");
    expect(await setUserStatus(db, adminId, userId, "active")).toEqual({ ok: true, value: "changed" });
    expect(await statusOf(userId)).toBe("active");

    const rows = await auditRows(userId);
    expect(rows.map((row) => row.action)).toEqual(["user.suspend", "user.reactivate"]);
    expect(rows[0]).toMatchObject({ admin_id: adminId, before: { status: "active" }, after: { status: "suspended" } });
  });

  it("n'écrit rien quand le statut est déjà celui demandé", async () => {
    const before = (await auditRows(userId)).length;
    expect(await setUserStatus(db, adminId, userId, "active")).toEqual({ ok: true, value: "unchanged" });
    expect(await auditRows(userId)).toHaveLength(before);
  });

  it("refuse un autre admin, son propre compte et un compte inconnu, sans rien écrire", async () => {
    expect(await setUserStatus(db, adminId, otherAdminId, "suspended")).toEqual({ ok: false, error: "admin_target" });
    expect(await setUserStatus(db, adminId, adminId, "suspended")).toEqual({ ok: false, error: "self" });
    expect(await setUserStatus(db, adminId, randomUUID(), "suspended")).toEqual({ ok: false, error: "not_found" });
    expect(await statusOf(otherAdminId)).toBe("active");
    expect(await auditRows(otherAdminId)).toHaveLength(0);
  });

  it("annule la modification si la ligne d'audit ne peut pas être écrite", async () => {
    // Administrateur inexistant : la clé étrangère du journal échoue, la suspension doit être annulée avec lui.
    await expect(setUserStatus(db, randomUUID(), userId, "suspended")).rejects.toThrow();
    expect(await statusOf(userId)).toBe("active");
  });
});

describe("updateSetting", () => {
  it("enregistre la valeur et journalise l'ancienne et la nouvelle", async () => {
    const next = Number(originalFreeQuota) + 1;
    expect(await updateSetting(db, adminId, "free_daily_quota", next)).toBe("changed");
    const [row] = await sql<{ value: unknown; updated_by: string }[]>`
      select value, updated_by from public.app_settings where key = 'free_daily_quota'`;
    expect(row).toMatchObject({ value: next, updated_by: adminId });
    const audit = await auditRows("free_daily_quota");
    expect(audit.at(-1)).toMatchObject({ action: "setting.update", admin_id: adminId, after: { value: next } });
  });

  it("n'écrit rien pour une valeur identique", async () => {
    const before = (await auditRows("free_daily_quota")).length;
    const current = Number((await sql<{ value: unknown }[]>`select value from public.app_settings where key = 'free_daily_quota'`)[0]?.value);
    expect(await updateSetting(db, adminId, "free_daily_quota", current)).toBe("unchanged");
    expect(await auditRows("free_daily_quota")).toHaveLength(before);
  });
});

describe("lectures du back-office", () => {
  it("retrouve un utilisateur par une partie de son email, sans casse", async () => {
    const found = await searchUsers(db, `${PREFIX}-USER`);
    expect(found.map((user) => user.id)).toEqual([userId]);
    expect(found[0]?.email).toBe(`${PREFIX}-user@example.com`);
  });

  it("affiche le journal du plus récent au plus ancien, avec le nom de l'admin", async () => {
    const { rows } = await loadAuditLog(db, 1);
    const ours = rows.filter((row) => row.adminId === adminId);
    expect(ours.length).toBeGreaterThanOrEqual(3);
    expect(ours[0]?.action).toBe("setting.update");
    expect(ours[0]?.adminName).toBe(`${PREFIX}-admin`);
  });
});
