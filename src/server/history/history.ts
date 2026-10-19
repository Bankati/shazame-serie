import "server-only";

import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import type { CatalogProvider, MediaType } from "@/server/catalog/catalog-provider";
import { type Database, withQueryTimeout } from "@/server/db/client";
import { identifications } from "@/server/db/schema";
import { CATALOG_BUDGET_MS, lookupTitleDetails } from "@/server/catalog/title-lookup";
import { log } from "@/server/log";

// Historique (U17, RG11, CDC 12.5) : les 50 dernières identifications d'un compte dont un titre a été
// affiché. Titres et affiches relus via le catalogue à l'affichage (jamais copiés en base : les conditions
// TMDB limitent la conservation à 6 mois, l'historique est gardé 2 ans).

export const HISTORY_LIMIT = 50;

/** RG11 : identifications conservées 2 ans. */
export const RETENTION_INTERVAL = "2 years";
const PURGE_BATCH = 5_000;

export type HistoryRow = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  confidence: number;
  createdAt: Date;
};

export type HistoryEntry = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  confidence: number;
  /** Date ISO (UTC) ; affichée en heure de Paris. */
  identifiedAt: string;
  /** null si le catalogue n'a pas répondu ou ne connaît plus le titre. */
  title: string | null;
  year: number | null;
  posterPath: string | null;
};

/** Identifications au résultat affiché de ce compte uniquement, plus récentes d'abord. */
export async function listHistoryRows(db: Database, userId: string, limit = HISTORY_LIMIT): Promise<HistoryRow[]> {
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({
        id: identifications.id,
        tmdbId: identifications.tmdbId,
        mediaType: identifications.mediaType,
        confidence: identifications.confidence,
        createdAt: identifications.createdAt,
      })
      .from(identifications)
      .where(
        and(
          eq(identifications.userId, userId),
          eq(identifications.outcome, "shown"),
          isNotNull(identifications.tmdbId),
          isNotNull(identifications.mediaType),
        ),
      )
      .orderBy(desc(identifications.createdAt))
      .limit(limit),
  );
  return rows.flatMap((row) =>
    row.tmdbId !== null && row.mediaType !== null
      ? [{ id: row.id, tmdbId: row.tmdbId, mediaType: row.mediaType, confidence: row.confidence ?? 0, createdAt: row.createdAt }]
      : [],
  );
}

/** Ajoute titre, année et affiche à chaque ligne ; une panne ou une lenteur du catalogue n'efface aucune ligne. */
export async function enrichHistory(
  rows: readonly HistoryRow[],
  catalog: CatalogProvider | null,
  budgetMs: number = CATALOG_BUDGET_MS,
): Promise<HistoryEntry[]> {
  const details = await lookupTitleDetails(rows, catalog, budgetMs);
  const missing = details.filter((detail) => detail === null).length;
  if (missing > 0) {
    log.warn("history.titles_unavailable", { missing });
  }
  return rows.map((row, index) => {
    const detail = details[index] ?? null;
    return {
      id: row.id,
      tmdbId: row.tmdbId,
      mediaType: row.mediaType,
      confidence: row.confidence,
      identifiedAt: row.createdAt.toISOString(),
      title: detail?.title ?? null,
      year: detail?.year ?? null,
      posterPath: detail?.posterPath ?? null,
    };
  });
}

/**
 * RG11 : supprime les identifications de plus de 2 ans (comptes et visiteurs), par lots pour ne jamais
 * dépasser le délai d'une requête. Renvoie le nombre de lignes supprimées.
 */
export async function purgeOldIdentifications(db: Database): Promise<number> {
  let total = 0;
  for (;;) {
    const deleted = await withQueryTimeout(db, (tx) =>
      tx.execute(sql`
        delete from ${identifications}
        where ${identifications.id} in (
          select ${identifications.id} from ${identifications}
          where ${identifications.createdAt} < now() - ${RETENTION_INTERVAL}::interval
          limit ${PURGE_BATCH}
        )
        returning 1`),
    );
    total += deleted.length;
    if (deleted.length < PURGE_BATCH) {
      return total;
    }
  }
}
