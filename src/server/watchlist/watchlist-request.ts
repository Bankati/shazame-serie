import "server-only";

import { type WatchlistItem, watchlistItemSchema, type WatchlistState } from "@/schemas/watchlist";
import { type Account, getCurrentAccount } from "@/server/auth/guards";
import { getEntitlement, watchlistLimit } from "@/server/billing/entitlement";
import { getDb } from "@/server/db/client";
import { jsonError, jsonOk } from "@/server/http/respond";
import { isSameOrigin } from "@/server/http/same-origin";
import { log } from "@/server/log";

import { type AddResult, addToWatchlist, listWatchlist, removeFromWatchlist } from "./watchlist";

// GET / POST / DELETE /api/watchlist (U18). Ordre fixe (code-standards.md) : origine (mutations), validation
// zod, session et statut, puis opération filtrée par le compte. Réponses propres au compte : jamais en cache.
const NO_STORE = { "Cache-Control": "private, no-store" };

export type WatchlistDeps = {
  account: () => Promise<Account | null>;
  limitFor: (userId: string) => Promise<number | null>;
  list: (userId: string) => Promise<WatchlistItem[]>;
  add: (userId: string, item: WatchlistItem, limit: number | null) => Promise<AddResult>;
  remove: (userId: string, item: WatchlistItem) => Promise<number>;
};

export function watchlistDeps(): WatchlistDeps {
  return {
    account: getCurrentAccount,
    limitFor: async (userId) => watchlistLimit(await getEntitlement(userId)),
    list: async (userId) => (await listWatchlist(getDb(), userId)).map(({ tmdbId, mediaType }) => ({ tmdbId, mediaType })),
    add: (userId, item, limit) => addToWatchlist(getDb(), userId, item, limit),
    remove: (userId, item) => removeFromWatchlist(getDb(), userId, item),
  };
}

export async function handleWatchlistGet(deps: WatchlistDeps = watchlistDeps()): Promise<Response> {
  const account = await deps.account();
  if (!account) {
    return jsonError("UNAUTHENTICATED", undefined, { headers: NO_STORE });
  }
  // Un compte suspendu garde la lecture de ses données (architecture.md).
  try {
    const [items, limit] = await Promise.all([deps.list(account.id), deps.limitFor(account.id)]);
    const state: WatchlistState = { items, limit };
    return jsonOk(state, { headers: NO_STORE });
  } catch {
    log.error("watchlist.read_failed");
    return jsonError("INTERNAL_ERROR", undefined, { headers: NO_STORE });
  }
}

export async function handleWatchlistChange(
  request: Request,
  operation: "add" | "remove",
  deps: WatchlistDeps = watchlistDeps(),
): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", undefined, { headers: NO_STORE });
  }
  const body = watchlistItemSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }
  const account = await deps.account();
  if (!account) {
    return jsonError("UNAUTHENTICATED", undefined, { headers: NO_STORE });
  }
  if (account.status === "suspended") {
    return jsonError("ACCOUNT_SUSPENDED", undefined, { headers: NO_STORE });
  }

  try {
    const limit = await deps.limitFor(account.id);
    if (operation === "remove") {
      return jsonOk({ count: await deps.remove(account.id, body.data), limit }, { headers: NO_STORE });
    }
    const result = await deps.add(account.id, body.data, limit);
    if (result.status === "full") {
      return jsonError("WATCHLIST_FULL", undefined, { headers: NO_STORE }, { limit });
    }
    return jsonOk({ count: result.count, limit }, { status: result.status === "added" ? 201 : 200, headers: NO_STORE });
  } catch {
    log.error("watchlist.write_failed", { operation });
    return jsonError("INTERNAL_ERROR", undefined, { headers: NO_STORE });
  }
}
