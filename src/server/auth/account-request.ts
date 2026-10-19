import "server-only";

import type { AccountSummary } from "@/schemas/account";
import { jsonOk } from "@/server/http/respond";

import { getCurrentAccount } from "./guards";

// GET /api/account : propre à chaque utilisateur, jamais mis en cache.
export async function handleAccountRequest(): Promise<Response> {
  const account = await getCurrentAccount();
  const summary: AccountSummary = {
    account: account ? { displayName: account.displayName, email: account.email } : null,
  };
  return jsonOk(summary, { headers: { "Cache-Control": "private, no-store" } });
}
