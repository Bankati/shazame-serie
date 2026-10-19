import "server-only";

import type { AccountSummary } from "@/schemas/account";
import { AVATAR_URL_TTL_S, loadProfileDetails, supabaseAvatarStore } from "@/server/account/profile-service";
import { getDb } from "@/server/db/client";
import { jsonOk } from "@/server/http/respond";
import { getStorageAdmin } from "@/server/storage/admin-client";

import { getCurrentAccount } from "./guards";

// GET /api/account : propre à chaque utilisateur, jamais mis en cache.
export async function handleAccountRequest(): Promise<Response> {
  const account = await getCurrentAccount();
  const summary: AccountSummary = {
    account: account ? { displayName: account.displayName, email: account.email, avatarUrl: await avatarUrlFor(account.id) } : null,
  };
  return jsonOk(summary, { headers: { "Cache-Control": "private, no-store" } });
}

/** Lien signé vers la photo du compte ; null sans photo ou si le stockage ne répond pas (l'initiale s'affiche). */
export async function avatarUrlFor(userId: string): Promise<string | null> {
  const client = getStorageAdmin();
  if (!client) return null;
  try {
    const details = await loadProfileDetails(getDb(), userId);
    return details?.avatarPath ? await supabaseAvatarStore(client).signedUrl(details.avatarPath, AVATAR_URL_TTL_S) : null;
  } catch {
    return null;
  }
}
