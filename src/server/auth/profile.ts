import "server-only";

import { eq } from "drizzle-orm";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { consents, profiles } from "@/server/db/schema";
import { LEGAL_VERSIONS } from "@/shared/legal/versions";

// Profil et consentements (U04, décision 4) : créés par notre serveur, ensemble, la première fois qu'un
// compte se présente (inscription email, premier retour de Google). Les appels suivants ne font rien.

const DISPLAY_NAME_MAX = 80;

export type ProfileRow = {
  displayName: string | null;
  role: "user" | "admin";
  status: "active" | "suspended";
  deletedAt: Date | null;
};

/**
 * Crée le profil et les consentements CGU + confidentialité (versions en vigueur) s'ils n'existent pas.
 * À n'appeler qu'après que l'utilisateur a accepté les textes (case cochée, ou mention à côté du bouton Google).
 */
export async function ensureAccount(
  db: Database,
  input: { userId: string; displayName: string | null },
): Promise<{ created: boolean }> {
  return withQueryTimeout(db, async (tx) => {
    const inserted = await tx
      .insert(profiles)
      .values({ id: input.userId, displayName: cleanDisplayName(input.displayName) })
      .onConflictDoNothing({ target: profiles.id })
      .returning({ id: profiles.id });
    if (inserted.length === 0) {
      return { created: false };
    }
    await tx.insert(consents).values([
      { userId: input.userId, kind: "terms", version: LEGAL_VERSIONS.terms, granted: true },
      { userId: input.userId, kind: "privacy", version: LEGAL_VERSIONS.privacy, granted: true },
    ]);
    return { created: true };
  });
}

/** Rôle et statut relus en base à chaque requête (architecture.md : jamais depuis le jeton). */
export async function loadProfile(db: Database, userId: string): Promise<ProfileRow | null> {
  return withQueryTimeout(db, async (tx) => {
    const rows = await tx
      .select({
        displayName: profiles.displayName,
        role: profiles.role,
        status: profiles.status,
        deletedAt: profiles.deletedAt,
      })
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);
    return rows[0] ?? null;
  });
}

export function cleanDisplayName(raw: string | null | undefined): string | null {
  const name = raw?.replace(/\s+/g, " ").trim().slice(0, DISPLAY_NAME_MAX);
  return name || null;
}
