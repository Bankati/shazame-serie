import "server-only";

import type { MediaType } from "@/server/catalog/catalog-provider";
import { lookupTitleDetails } from "@/server/catalog/title-lookup";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { getEntitlement, watchlistLimit } from "@/server/billing/entitlement";
import { getDb } from "@/server/db/client";
import { log } from "@/server/log";

import { listWatchlist } from "./watchlist";

export type WatchlistEntry = {
  tmdbId: number;
  mediaType: MediaType;
  title: string | null;
  year: number | null;
  posterPath: string | null;
};

/** Liste d'un compte dont la session a déjà été vérifiée (requireUser), avec titres et affiches. */
export async function loadAccountWatchlist(userId: string): Promise<{ entries: WatchlistEntry[]; limit: number | null }> {
  const [rows, plan] = await Promise.all([listWatchlist(getDb(), userId), getEntitlement(userId)]);
  let catalog = null;
  try {
    catalog = getCatalog();
  } catch {
    // TMDB non configuré : titres « indisponibles », la liste reste affichée.
  }
  const details = await lookupTitleDetails(rows, catalog);
  const missing = details.filter((detail) => detail === null).length;
  if (missing > 0) log.warn("watchlist.titles_unavailable", { missing });
  return {
    limit: watchlistLimit(plan),
    entries: rows.map((row, index) => ({
      tmdbId: row.tmdbId,
      mediaType: row.mediaType,
      title: details[index]?.title ?? null,
      year: details[index]?.year ?? null,
      posterPath: details[index]?.posterPath ?? null,
    })),
  };
}
