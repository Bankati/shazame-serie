import "server-only";

import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { getDb } from "@/server/db/client";

import { enrichHistory, type HistoryEntry, listHistoryRows } from "./history";

/** Historique d'un compte dont la session a déjà été vérifiée par l'appelant (requireUser). */
export async function loadAccountHistory(userId: string): Promise<HistoryEntry[]> {
  const rows = await listHistoryRows(getDb(), userId);
  let catalog = null;
  try {
    catalog = getCatalog();
  } catch {
    // TMDB non configuré : lignes sans titre (« Titre indisponible »).
  }
  return enrichHistory(rows, catalog);
}
