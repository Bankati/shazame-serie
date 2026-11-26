import "server-only";

import type { MediaType } from "@/server/catalog/catalog-provider";

// Règles pures de la revue d'un signalement par un admin (U26b). Testées à part.

export type TitleRef = { tmdbId: number; mediaType: MediaType };
export type ReportStatus = "open" | "reviewed" | "added_to_eval" | "rejected";

export type ReviewTarget = {
  status: ReportStatus;
  proposed: TitleRef | null;
  hasImages: boolean;
};

export type CacheState = TitleRef & { confidence: number; disabled: boolean; validated: boolean };

export type ReviewRefusal = "not_found" | "already_reviewed" | "eval_needs_images";

export type ReviewDecision =
  | { kind: "refused"; reason: ReviewRefusal }
  | { kind: "review"; status: Exclude<ReportStatus, "open">; retained: TitleRef };

export const sameTitle = (a: TitleRef | null, b: TitleRef | null): boolean =>
  a !== null && b !== null && a.tmdbId === b.tmdbId && a.mediaType === b.mediaType;

/**
 * Statut final : « ajouté au jeu de test » si demandé (images exigées) ; sinon « rejeté » quand le titre retenu
 * est le titre proposé (le résultat était juste), « revu » quand il le corrige.
 */
export function decideReview(target: ReviewTarget | null, retained: TitleRef, addToEval: boolean): ReviewDecision {
  if (!target) return { kind: "refused", reason: "not_found" };
  if (target.status !== "open") return { kind: "refused", reason: "already_reviewed" };
  if (addToEval && !target.hasImages) return { kind: "refused", reason: "eval_needs_images" };
  const status = addToEval ? "added_to_eval" : sameTitle(target.proposed, retained) ? "rejected" : "reviewed";
  return { kind: "review", status, retained };
}

/** Confiance d'une réponse vérifiée par un humain quand l'admin change le titre en cache. */
export const VALIDATED_CONFIDENCE = 100;

export type CacheCorrection = TitleRef & { confidence: number; validated: true; disabled: false; clearAlternatives: boolean };

/**
 * Effet sur l'entrée de cache de l'extrait : réactivée et validée, avec le titre retenu. Si le titre change,
 * les alternatives (calculées pour l'ancien titre) sont vidées et la confiance passe à 100.
 */
export function decideCacheCorrection(entry: CacheState, retained: TitleRef): CacheCorrection | null {
  const titleChanges = !sameTitle(entry, retained);
  if (!titleChanges && entry.validated && !entry.disabled) return null;
  return {
    tmdbId: retained.tmdbId,
    mediaType: retained.mediaType,
    confidence: titleChanges ? VALIDATED_CONFIDENCE : entry.confidence,
    validated: true,
    disabled: false,
    clearAlternatives: titleChanges,
  };
}
