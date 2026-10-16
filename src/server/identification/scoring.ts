import "server-only";

import type { MediaType } from "@/server/catalog/catalog-provider";
import type { MatchResult } from "@/server/catalog/matching";

// Score de confiance (CDC 15.2) : combine la confiance de l'IA et la qualité du rapprochement TMDB,
// puis décide de l'affichage. Fonctions pures ; constantes de départ, calibrées sur le jeu de test (U13).

/** Part de la confiance de l'IA conservée quel que soit le rapprochement (le reste dépend de sa qualité). */
export const AI_CONFIDENCE_FLOOR_RATIO = 0.5;
/** À partir de ce score, résultat « Très probable » (ui-context.md). */
export const SHOW_MIN_CONFIDENCE = 80;
/** À partir de ce score, un résultat est affiché et l'identification décomptée (RG3). */
export const DISPLAY_MIN_CONFIDENCE = 50;
export const MAX_ALTERNATIVES = 3;

export type ScoringCandidate = {
  /** Confiance annoncée par l'IA pour ce titre (0 à 100). */
  aiConfidence: number;
  /** Rapprochement TMDB du titre proposé (U08). */
  match: MatchResult;
};

export type ScoredTitle = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  /** Confiance finale affichée (0 à 100). */
  confidence: number;
};

export type Decision = "show" | "show_with_alternatives" | "ask_another_clip";

export type IdentificationScore =
  | { decision: "show" | "show_with_alternatives"; main: ScoredTitle; alternatives: ScoredTitle[] }
  | { decision: "ask_another_clip"; main: null; alternatives: ScoredTitle[] };

/** Confiance finale d'un candidat retrouvé dans TMDB. */
export function finalConfidence(aiConfidence: number, matchQuality: number): number {
  const ai = Math.min(100, Math.max(0, aiConfidence));
  const quality = Math.min(1, Math.max(0, matchQuality));
  return Math.round(ai * (AI_CONFIDENCE_FLOOR_RATIO + (1 - AI_CONFIDENCE_FLOOR_RATIO) * quality));
}

export function decide(confidence: number): Decision {
  if (confidence >= SHOW_MIN_CONFIDENCE) {
    return "show";
  }
  return confidence >= DISPLAY_MIN_CONFIDENCE ? "show_with_alternatives" : "ask_another_clip";
}

/**
 * Classe les candidats (réponse principale puis alternatives de l'IA) : un candidat sans fiche TMDB est écarté,
 * une même fiche n'apparaît qu'une fois (meilleure confiance), le meilleur score devient le résultat principal.
 */
export function scoreIdentification(candidates: readonly ScoringCandidate[]): IdentificationScore {
  const byTitle = new Map<string, ScoredTitle>();
  for (const { aiConfidence, match } of candidates) {
    if (match.status !== "matched") {
      continue;
    }
    const { best } = match;
    const scored: ScoredTitle = {
      tmdbId: best.tmdbId,
      mediaType: best.mediaType,
      title: best.title,
      year: best.year,
      posterPath: best.posterPath,
      confidence: finalConfidence(aiConfidence, best.quality),
    };
    const key = `${scored.mediaType}:${scored.tmdbId}`;
    const existing = byTitle.get(key);
    if (!existing || scored.confidence > existing.confidence) {
      byTitle.set(key, scored);
    }
  }

  const ranked = [...byTitle.values()].filter((title) => title.confidence > 0).sort((a, b) => b.confidence - a.confidence);
  const [main, ...rest] = ranked;
  if (!main) {
    return { decision: "ask_another_clip", main: null, alternatives: [] };
  }

  const decision = decide(main.confidence);
  if (decision === "ask_another_clip") {
    // Pas de résultat principal ni de décompte (RG3) ; les pistes restent proposées.
    return { decision, main: null, alternatives: ranked.slice(0, MAX_ALTERNATIVES) };
  }
  return { decision, main, alternatives: rest.slice(0, MAX_ALTERNATIVES) };
}
