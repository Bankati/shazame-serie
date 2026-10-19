import "server-only";

import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";

import type { SupabaseClient } from "@supabase/supabase-js";

import { cleanDisplayName } from "@/server/auth/profile";
import { type Database, withQueryTimeout } from "@/server/db/client";
import { profiles } from "@/server/db/schema";
import { log } from "@/server/log";

// Profil (U05) : nom affiché et photo. Toutes les fonctions reçoivent l'identifiant du compte issu de la
// session vérifiée (invariant 7) ; aucune ne lit un identifiant venant de la requête.

export const AVATAR_BUCKET = "avatars";
/** Durée de validité des liens signés vers la photo (bucket privé). */
export const AVATAR_URL_TTL_S = 60 * 60;

/** Stockage des photos (Supabase Storage en production, faux stockage dans les tests). */
export type AvatarStore = {
  upload(path: string, data: Buffer): Promise<void>;
  remove(paths: string[]): Promise<void>;
  signedUrl(path: string, expiresInSeconds: number): Promise<string | null>;
};

export function supabaseAvatarStore(client: SupabaseClient): AvatarStore {
  const bucket = client.storage.from(AVATAR_BUCKET);
  return {
    async upload(path, data) {
      const { error } = await bucket.upload(path, data, { contentType: "image/webp", upsert: false });
      if (error) throw new Error("avatar_upload_failed");
    },
    async remove(paths) {
      const { error } = await bucket.remove(paths);
      if (error) throw new Error("avatar_remove_failed");
    },
    async signedUrl(path, expiresInSeconds) {
      const { data, error } = await bucket.createSignedUrl(path, expiresInSeconds);
      return error ? null : data.signedUrl;
    },
  };
}

export type ProfileDetails = {
  displayName: string | null;
  avatarPath: string | null;
  createdAt: Date;
};

export async function loadProfileDetails(db: Database, userId: string): Promise<ProfileDetails | null> {
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({ displayName: profiles.displayName, avatarPath: profiles.avatarPath, createdAt: profiles.createdAt })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1),
  );
  return rows[0] ?? null;
}

/** Nouveau nom affiché (déjà validé) ; seul le profil de ce compte est modifié. */
export async function updateDisplayName(db: Database, userId: string, displayName: string): Promise<void> {
  await withQueryTimeout(db, (tx) =>
    tx.update(profiles).set({ displayName: cleanDisplayName(displayName) }).where(eq(profiles.id, userId)),
  );
}

/**
 * Remplace la photo : nouveau fichier d'abord (chemin aléatoire sous le dossier du compte), puis profil,
 * puis suppression de l'ancien. Une panne entre deux étapes ne laisse jamais le profil sans photo valide.
 */
export async function replaceAvatar(db: Database, store: AvatarStore, userId: string, image: Buffer): Promise<string> {
  const path = `${userId}/${randomUUID()}.webp`;
  await store.upload(path, image);
  const previous = await withQueryTimeout(db, async (tx) => {
    const [row] = await tx.select({ avatarPath: profiles.avatarPath }).from(profiles).where(eq(profiles.id, userId)).limit(1);
    await tx.update(profiles).set({ avatarPath: path }).where(eq(profiles.id, userId));
    return row?.avatarPath ?? null;
  });
  await removeQuietly(store, previous);
  return path;
}

/** Supprime la photo du profil et du stockage. */
export async function removeAvatar(db: Database, store: AvatarStore, userId: string): Promise<void> {
  const previous = await withQueryTimeout(db, async (tx) => {
    const [row] = await tx.select({ avatarPath: profiles.avatarPath }).from(profiles).where(eq(profiles.id, userId)).limit(1);
    await tx.update(profiles).set({ avatarPath: null }).where(eq(profiles.id, userId));
    return row?.avatarPath ?? null;
  });
  await removeQuietly(store, previous);
}

// Un ancien fichier qui ne se supprime pas n'est pas grave pour l'utilisateur : journalisé, sans le chemin.
async function removeQuietly(store: AvatarStore, path: string | null): Promise<void> {
  if (!path) return;
  try {
    await store.remove([path]);
  } catch {
    log.warn("avatar.cleanup_failed");
  }
}

/** Données de la page « Mon compte » pour un compte dont la session a déjà été vérifiée. */
export async function loadAccountPage(
  db: Database,
  store: AvatarStore | null,
  userId: string,
): Promise<{ displayName: string; createdAt: Date | null; avatarUrl: string | null }> {
  const details = await loadProfileDetails(db, userId);
  let avatarUrl: string | null = null;
  if (store && details?.avatarPath) {
    avatarUrl = await store.signedUrl(details.avatarPath, AVATAR_URL_TTL_S).catch(() => null);
  }
  return { displayName: details?.displayName ?? "", createdAt: details?.createdAt ?? null, avatarUrl };
}
