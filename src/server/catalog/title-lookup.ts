import "server-only";

import type { CatalogProvider, CatalogTitleDetails, MediaType } from "./catalog-provider";

// Lecture de fiches pour une liste de titres (historique U17, liste de suivi U18) : titres et affiches relus
// au catalogue à l'affichage, jamais copiés en base (conditions TMDB : conservation limitée à 6 mois).

/** Appels simultanés au catalogue au plus (jusqu'à 50 fiches ou plus à la première visite, en cache ensuite). */
export const CATALOG_CONCURRENCY = 8;
/**
 * Temps maximal accordé au catalogue pour toute la page (audit du 19 octobre 2026) : sans lui, TMDB lent
 * pouvait bloquer la page plus d'une minute (délai de 5 s et une nouvelle tentative par fiche).
 * Au-delà, les titres restants s'affichent sans fiche.
 */
export const CATALOG_BUDGET_MS = 4_000;

/** Fiche de chaque titre, dans l'ordre ; null si le catalogue est absent, en panne ou trop lent. */
export async function lookupTitleDetails(
  items: readonly { tmdbId: number; mediaType: MediaType }[],
  catalog: CatalogProvider | null,
  budgetMs: number = CATALOG_BUDGET_MS,
): Promise<(CatalogTitleDetails | null)[]> {
  let expired = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<null>((resolve) => {
    timer = setTimeout(() => {
      expired = true;
      resolve(null);
    }, budgetMs);
  });
  const details = await mapWithConcurrency(items, CATALOG_CONCURRENCY, async (item) => {
    // Budget épuisé : plus aucun appel au catalogue pour les titres restants.
    if (!catalog || expired) return null;
    const lookup = catalog.getTitleDetails(item.tmdbId, item.mediaType).catch(() => null);
    return Promise.race([lookup, deadline]);
  });
  clearTimeout(timer);
  return details;
}

/** Applique `work` à chaque élément, `limit` à la fois au plus, résultats dans l'ordre d'entrée. */
export async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, work: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await work(items[index] as T);
    }
  });
  await Promise.all(workers);
  return results;
}
