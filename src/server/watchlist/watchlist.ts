import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import type { WatchlistItem } from "@/schemas/watchlist";
import { type Database, type DbTransaction, withQueryTimeout } from "@/server/db/client";
import { watchlistItems } from "@/server/db/schema";

// Liste de suivi (U18, CDC 12.5). Chaque requête est filtrée par le compte de la session vérifiée
// (invariant 7) : l'appelant passe l'identifiant issu de requireUser, jamais une valeur du client.

export type WatchlistRow = WatchlistItem & { addedAt: Date };

export type AddResult = { status: "added" | "exists"; count: number } | { status: "full"; count: number };

/** Titres du compte, plus récents d'abord. */
export async function listWatchlist(db: Database, userId: string): Promise<WatchlistRow[]> {
  return withQueryTimeout(db, (tx) =>
    tx
      .select({ tmdbId: watchlistItems.tmdbId, mediaType: watchlistItems.mediaType, addedAt: watchlistItems.addedAt })
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId))
      .orderBy(desc(watchlistItems.addedAt)),
  );
}

/**
 * Ajoute un titre. La limite (null = illimitée, Premium) est vérifiée dans la même transaction, sous un
 * verrou propre au compte : deux ajouts simultanés à 99 titres ne peuvent pas aboutir à 101.
 * Un titre déjà présent n'est ni dupliqué ni compté deux fois.
 */
export async function addToWatchlist(db: Database, userId: string, item: WatchlistItem, limit: number | null): Promise<AddResult> {
  return withQueryTimeout(db, async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`watchlist:${userId}`}))`);
    const current = await countItems(tx, userId);
    const existing = await tx
      .select({ tmdbId: watchlistItems.tmdbId })
      .from(watchlistItems)
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, item.tmdbId), eq(watchlistItems.mediaType, item.mediaType)))
      .limit(1);
    if (existing.length > 0) {
      return { status: "exists", count: current };
    }
    if (limit !== null && current >= limit) {
      return { status: "full", count: current };
    }
    await tx.insert(watchlistItems).values({ userId, tmdbId: item.tmdbId, mediaType: item.mediaType });
    return { status: "added", count: current + 1 };
  });
}

/** Retire un titre (sans effet s'il n'y est pas). Renvoie le nombre de titres restants. */
export async function removeFromWatchlist(db: Database, userId: string, item: WatchlistItem): Promise<number> {
  return withQueryTimeout(db, async (tx) => {
    await tx
      .delete(watchlistItems)
      .where(and(eq(watchlistItems.userId, userId), eq(watchlistItems.tmdbId, item.tmdbId), eq(watchlistItems.mediaType, item.mediaType)));
    return countItems(tx, userId);
  });
}

async function countItems(tx: DbTransaction, userId: string): Promise<number> {
  const [row] = await tx.select({ value: count() }).from(watchlistItems).where(eq(watchlistItems.userId, userId));
  return row?.value ?? 0;
}
