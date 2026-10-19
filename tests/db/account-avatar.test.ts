import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { processAvatar } from "@/server/account/avatar-image";
import { AVATAR_BUCKET, loadProfileDetails, removeAvatar, replaceAvatar, supabaseAvatarStore, updateDisplayName } from "@/server/account/profile-service";
import { ensureAccount } from "@/server/auth/profile";
import { getDb } from "@/server/db/client";

import { adminSql, publicClient, secretClient } from "./helpers";

// Critère de fin de U05 : modification persistée, un autre utilisateur ne peut pas modifier ce profil.
const sql = adminSql();
const db = getDb();
const admin = secretClient();
const store = supabaseAvatarStore(admin);
const PREFIX = `test-avatar-${Date.now()}`;
const users: string[] = [];
let alice = "";
let bruno = "";

async function createAccount(label: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({ email: `${PREFIX}-${label}@example.com`, password: "motdepasse-test", email_confirm: true });
  if (error || !data.user) throw error ?? new Error("utilisateur non créé");
  await ensureAccount(db, { userId: data.user.id, displayName: label });
  users.push(data.user.id);
  return data.user.id;
}

async function avatarImage(): Promise<Buffer> {
  const input = await sharp({ create: { width: 400, height: 400, channels: 3, background: "#336699" } }).jpeg().toBuffer();
  const result = await processAvatar(input);
  if (!result.ok) throw new Error("image de test refusée");
  return result.data;
}

async function objectsOf(userId: string): Promise<string[]> {
  const { data } = await admin.storage.from(AVATAR_BUCKET).list(userId);
  return (data ?? []).map((item) => `${userId}/${item.name}`);
}

beforeAll(async () => {
  alice = await createAccount("alice");
  bruno = await createAccount("bruno");
});

afterAll(async () => {
  for (const id of users) {
    const paths = await objectsOf(id);
    if (paths.length > 0) await admin.storage.from(AVATAR_BUCKET).remove(paths);
    await admin.auth.admin.deleteUser(id);
  }
  await sql.end();
});

describe("profil", () => {
  it("le nom n'est modifié que pour le compte concerné", async () => {
    await updateDisplayName(db, alice, "  Alice   Martin ");
    expect((await loadProfileDetails(db, alice))?.displayName).toBe("Alice Martin");
    expect((await loadProfileDetails(db, bruno))?.displayName).toBe("bruno");
  });

  it("la photo est stockée sous le dossier du compte ; la remplacer supprime l'ancienne", async () => {
    const first = await replaceAvatar(db, store, alice, await avatarImage());
    expect(first.startsWith(`${alice}/`)).toBe(true);
    const second = await replaceAvatar(db, store, alice, await avatarImage());
    expect(await objectsOf(alice)).toEqual([second]);
    expect((await loadProfileDetails(db, alice))?.avatarPath).toBe(second);
    expect((await loadProfileDetails(db, bruno))?.avatarPath).toBeNull();
    expect(await store.signedUrl(second, 60)).toMatch(/^http/);
  });

  it("retirer la photo vide le profil et le stockage", async () => {
    await removeAvatar(db, store, alice);
    expect((await loadProfileDetails(db, alice))?.avatarPath).toBeNull();
    expect(await objectsOf(alice)).toEqual([]);
  });

  it("le bucket n'accepte que du WebP de 512 Ko au plus (migration 0004)", async () => {
    const [bucket] = await sql<{ public: boolean; file_size_limit: number; allowed_mime_types: string[] }[]>`
      select public, file_size_limit::int as file_size_limit, allowed_mime_types from storage.buckets where id = 'avatars'`;
    expect(bucket).toEqual({ public: false, file_size_limit: 524288, allowed_mime_types: ["image/webp"] });
  });
});

describe("clé publique (navigateur)", () => {
  it("ne peut ni envoyer ni lire une photo, même avec le bon chemin", async () => {
    const path = await replaceAvatar(db, store, bruno, await avatarImage());
    const anonymous = publicClient().storage.from(AVATAR_BUCKET);
    const upload = await anonymous.upload(`${bruno}/piege.webp`, await avatarImage(), { contentType: "image/webp" });
    expect(upload.error).not.toBeNull();
    const download = await anonymous.download(path);
    expect(download.error).not.toBeNull();
  });
});
