import "server-only";

import type { CatalogCandidate, MediaType } from "./catalog-provider";

// Rapprochement d'un titre proposé par l'IA avec les candidats du catalogue (CDC 12.1, 15.2). Fonctions pures.
// Poids et seuils : valeurs de départ, à calibrer sur le jeu de test (U13).

export const MATCH_WEIGHTS = { title: 0.6, year: 0.25, type: 0.15 } as const;
/** Bonus maximal de popularité : départage des homonymes quand l'année manque (« Dune »). */
export const POPULARITY_BONUS_MAX = 0.05;
/** En dessous, le titre ne ressemble pas assez : candidat ignoré. */
export const TITLE_MIN_SIMILARITY = 0.5;
/** Qualité minimale d'une correspondance. */
export const MATCH_MIN_QUALITY = 0.6;
export const MAX_ALTERNATIVES = 3;

/** Type annoncé par l'IA : un animé est un film ou une série selon TMDB. */
export type ProposedKind = "film" | "serie" | "anime";

export type ProposedTitle = {
  title: string;
  originalTitle?: string | null;
  year?: number | null;
  kind: ProposedKind;
};

export type MatchSignals = { title: number; year: number | null; type: number };

/** Candidat éventuellement vu dans plusieurs langues : ses autres titres comptent aussi pour la ressemblance. */
export type MatchCandidate = CatalogCandidate & { otherTitles?: string[] };

export type TitleMatch = MatchCandidate & { quality: number; signals: MatchSignals };

export type MatchResult =
  | { status: "matched"; best: TitleMatch; alternatives: TitleMatch[] }
  | { status: "none"; alternatives: TitleMatch[] };

const LEADING_ARTICLES = /^(le |la |les |l |un |une |des |the |a |an )/;

/** Minuscules, sans accents ni ponctuation, sans article initial (« L'Attaque des Titans » → « attaque des titans »). */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(LEADING_ARTICLES, "");
}

/** Ressemblance de 0 à 1 (coefficient de Dice sur les paires de lettres), 1 si identiques une fois normalisés. */
export function titleSimilarity(a: string, b: string): number {
  const left = normalizeTitle(a);
  const right = normalizeTitle(b);
  if (!left || !right) {
    return 0;
  }
  if (left === right) {
    return 1;
  }
  const leftPairs = bigrams(left);
  const rightPairs = bigrams(right);
  let shared = 0;
  for (const [pair, count] of leftPairs) {
    shared += Math.min(count, rightPairs.get(pair) ?? 0);
  }
  const total = sum(leftPairs) + sum(rightPairs);
  return total === 0 ? 0 : (2 * shared) / total;
}

/** Écart d'année : identique 1, ±1 an 0,8, ±2 ans 0,4, au-delà 0. Null si une des deux années manque. */
export function yearScore(proposed: number | null | undefined, actual: number | null): number | null {
  if (!proposed || !actual) {
    return null;
  }
  const gap = Math.abs(proposed - actual);
  return gap === 0 ? 1 : gap === 1 ? 0.8 : gap === 2 ? 0.4 : 0;
}

export function typeScore(kind: ProposedKind, mediaType: MediaType): number {
  if (kind === "anime") {
    return 1;
  }
  return (kind === "film" ? "movie" : "tv") === mediaType ? 1 : 0;
}

export function scoreCandidate(proposed: ProposedTitle, candidate: MatchCandidate): TitleMatch {
  const proposedTitles = [proposed.title, proposed.originalTitle].filter((value): value is string => Boolean(value));
  const candidateTitles = [candidate.title, candidate.originalTitle, ...(candidate.otherTitles ?? [])];
  const title = Math.max(
    ...proposedTitles.flatMap((wanted) => candidateTitles.map((known) => titleSimilarity(wanted, known))),
  );
  const year = yearScore(proposed.year, candidate.year);
  const type = typeScore(proposed.kind, candidate.mediaType);

  // Sans année connue, son poids est réparti sur le titre et le type.
  const weighted =
    year === null
      ? (MATCH_WEIGHTS.title * title + MATCH_WEIGHTS.type * type) / (MATCH_WEIGHTS.title + MATCH_WEIGHTS.type)
      : MATCH_WEIGHTS.title * title + MATCH_WEIGHTS.year * year + MATCH_WEIGHTS.type * type;
  const popularityBonus = POPULARITY_BONUS_MAX * Math.min(1, Math.log10(candidate.popularity + 1) / 3);
  const quality = round(Math.min(1, weighted + popularityBonus));

  return { ...candidate, quality, signals: { title: round(title), year, type } };
}

/**
 * Fusionne les résultats de plusieurs recherches (langues) : une fiche n'apparaît qu'une fois, avec tous ses titres.
 * La première occurrence garde son titre principal (la recherche française passe en premier).
 */
export function mergeCandidates(candidates: readonly CatalogCandidate[]): MatchCandidate[] {
  const merged = new Map<string, MatchCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.mediaType}:${candidate.tmdbId}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...candidate, otherTitles: [] });
      continue;
    }
    for (const title of [candidate.title, candidate.originalTitle]) {
      if (title !== existing.title && title !== existing.originalTitle && !existing.otherTitles?.includes(title)) {
        existing.otherTitles = [...(existing.otherTitles ?? []), title];
      }
    }
    existing.popularity = Math.max(existing.popularity, candidate.popularity);
  }
  return [...merged.values()];
}

/** Classe les candidats ; renvoie la meilleure correspondance (si assez sûre) et jusqu'à 3 alternatives. */
export function rankCandidates(proposed: ProposedTitle, candidates: readonly CatalogCandidate[]): MatchResult {
  const ranked = mergeCandidates(candidates)
    .map((candidate) => scoreCandidate(proposed, candidate))
    .filter((match) => match.signals.title >= TITLE_MIN_SIMILARITY)
    .sort((a, b) => b.quality - a.quality || b.popularity - a.popularity);

  const [best, ...rest] = ranked;
  if (best && best.quality >= MATCH_MIN_QUALITY) {
    return { status: "matched", best, alternatives: rest.slice(0, MAX_ALTERNATIVES) };
  }
  return { status: "none", alternatives: ranked.slice(0, MAX_ALTERNATIVES) };
}

function bigrams(text: string): Map<string, number> {
  const pairs = new Map<string, number>();
  const compact = text.replace(/ /g, "");
  if (compact.length === 1) {
    pairs.set(compact, 1);
  }
  for (let index = 0; index < compact.length - 1; index++) {
    const pair = compact.slice(index, index + 2);
    pairs.set(pair, (pairs.get(pair) ?? 0) + 1);
  }
  return pairs;
}

function sum(pairs: Map<string, number>): number {
  let total = 0;
  for (const count of pairs.values()) {
    total += count;
  }
  return total;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
