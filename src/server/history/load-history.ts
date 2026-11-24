import "server-only";

import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { getDb } from "@/server/db/client";

import { enrichHistory, type HistoryEntry, listHistoryRows } from "./history";

/**
 * Historique d'un compte dont la session a déjà été vérifiée par l'appelant (requireUser). `limit` : les plus
 * récentes seulement (rangée « Vos identifications récentes », U38), pour limiter les appels au catalogue.
 */
export async function loadAccountHistory(userId: string, limit?: number): Promise<HistoryEntry[]> {
  const rows = await listHistoryRows(getDb(), userId, limit);
  let catalog = null;
  try {
    catalog = getCatalog();
  } catch {
    // TMDB non configuré : lignes sans titre (« Titre indisponible »).
  }
  return enrichHistory(rows, catalog);
}
