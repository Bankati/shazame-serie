import "server-only";

import { cache } from "react";

import { getDb } from "@/server/db/client";
import { log } from "@/server/log";
import { captureSystemEvent } from "@/server/observability/posthog-server";

import { loadProfile, type ProfileRow } from "./profile";
import { createSupabaseServerClient, isAuthConfigured } from "./supabase";

// Session vérifiée et gardes (U04). La session est validée par getClaims() (signature du jeton vérifiée,
// AD-34) ; rôle et statut sont toujours relus dans `profiles`.

export type Account = {
  id: string;
  email: string | null;
  displayName: string | null;
  role: ProfileRow["role"];
  status: ProfileRow["status"];
};

export type AccessDenied = { ok: false; code: "UNAUTHENTICATED" | "FORBIDDEN" };
export type AccountAccess = { ok: true; account: Account } | AccessDenied;

/** Compte de la requête : session valide, profil présent et non supprimé. Sinon null (visiteur). */
export const getCurrentAccount = cache(async (): Promise<Account | null> => {
  if (!isAuthConfigured()) {
    return null;
  }
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId || data.claims.is_anonymous) {
      return null;
    }
    const profile = await loadProfile(getDb(), userId);
    return toAccount(userId, typeof data.claims.email === "string" ? data.claims.email : null, profile);
  } catch {
    // Auth ou base injoignable : traité comme un visiteur plutôt que de faire échouer la page. Signalé à
    // PostHog (sans personne) pour qu'une panne prolongée se voie.
    log.warn("auth.session_unavailable");
    await captureSystemEvent("auth_session_unavailable", {});
    return null;
  }
});

export function toAccount(userId: string, email: string | null, profile: ProfileRow | null): Account | null {
  if (!profile || profile.deletedAt) {
    return null;
  }
  return { id: userId, email, displayName: profile.displayName, role: profile.role, status: profile.status };
}

/**
 * Règles d'accès, testées à part : compte requis ; suspendu refusé sauf exception (export et suppression,
 * architecture.md) ; rôle admin si demandé.
 */
export function checkAccess(
  account: Account | null,
  options: { admin?: boolean; allowSuspended?: boolean } = {},
): AccountAccess {
  if (!account) {
    return { ok: false, code: "UNAUTHENTICATED" };
  }
  if (account.status === "suspended" && !options.allowSuspended) {
    return { ok: false, code: "FORBIDDEN" };
  }
  if (options.admin && account.role !== "admin") {
    return { ok: false, code: "FORBIDDEN" };
  }
  return { ok: true, account };
}

export async function requireUser(options: { allowSuspended?: boolean } = {}): Promise<AccountAccess> {
  return checkAccess(await getCurrentAccount(), options);
}

export async function requireAdmin(): Promise<AccountAccess> {
  return checkAccess(await getCurrentAccount(), { admin: true });
}
