import "server-only";

import type { CatalogProvider } from "./catalog-provider";
import { type MatchResult, type ProposedTitle, rankCandidates } from "./matching";

/**
 * Retrouve la fiche du titre proposé par l'IA (étape 14 de architecture.md). Recherche toujours en français
 * et en anglais, en parallèle : la recherche française peut ne pas remonter la bonne fiche quand l'IA donne
 * le titre anglais (« Attack on Titan » : la série n'apparaît qu'en anglais). Les titres d'une même fiche
 * sont fusionnés avant le classement. Réponses en cache 7 jours : le coût ne joue qu'à la première recherche.
 */
export async function matchProposedTitle(catalog: CatalogProvider, proposed: ProposedTitle): Promise<MatchResult> {
  const queries = unique([proposed.title, proposed.originalTitle]);
  const searches = queries.flatMap((query) => [catalog.searchTitles(query, "fr-FR"), catalog.searchTitles(query, "en-US")]);
  const results = await Promise.all(searches);
  // Français d'abord : le titre principal retenu pour l'affichage est le titre français.
  const ordered = [...results.filter((_, index) => index % 2 === 0), ...results.filter((_, index) => index % 2 === 1)];
  return rankCandidates(proposed, ordered.flat());
}

function unique(values: readonly (string | null | undefined)[]): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}
