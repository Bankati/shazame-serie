import "server-only";

import { z } from "zod";

// Abstraction du fournisseur de vision (architecture.md, AD-07) : OpenAI en V1, un autre modèle plus tard
// sans toucher au pipeline d'identification.

const kind = z.enum(["film", "serie", "anime"]);

/**
 * Schéma demandé au modèle (sortie structurée). Tous les champs sont requis, les absences valent null :
 * contraintes compatibles avec les sorties structurées. Les bornes sont appliquées ensuite (`normalizeAnswer`).
 */
export const modelAnswerSchema = z.object({
  recognized: z.boolean(),
  title: z.string().nullable(),
  originalTitle: z.string().nullable(),
  year: z.number().int().nullable(),
  kind: kind.nullable(),
  season: z.number().int().nullable(),
  episode: z.number().int().nullable(),
  confidence: z.number(),
  alternatives: z.array(
    z.object({
      title: z.string(),
      originalTitle: z.string().nullable(),
      year: z.number().int().nullable(),
      kind,
      confidence: z.number(),
    }),
  ),
});

export type ModelAnswer = z.infer<typeof modelAnswerSchema>;

export const MAX_ALTERNATIVES = 3;

export type VisionAlternative = {
  title: string;
  originalTitle: string | null;
  year: number | null;
  kind: z.infer<typeof kind>;
  confidence: number;
};

/** Réponse validée et bornée : c'est le « titre proposé » attendu par le rapprochement TMDB (U08). */
export type VisionAnswer =
  | { recognized: false; confidence: 0; alternatives: VisionAlternative[] }
  | {
      recognized: true;
      title: string;
      originalTitle: string | null;
      year: number | null;
      kind: z.infer<typeof kind>;
      season: number | null;
      episode: number | null;
      confidence: number;
      alternatives: VisionAlternative[];
    };

export type VisionUsage = { inputTokens: number; cachedInputTokens: number; outputTokens: number };

export type VisionResult = {
  answer: VisionAnswer;
  provider: string;
  model: string;
  promptVersion: string;
  attempts: number;
  latencyMs: number;
  usage: VisionUsage;
  /** Coût total des tentatives facturées, en micro-euros (entier). */
  costMicroEur: number;
};

/** `paused` : plafond de dépense du jour atteint (RG5), aucun appel n'a été fait. */
export type VisionErrorReason = "unavailable" | "refused" | "invalid_response" | "unpriced_model" | "paused";

/** Échec d'identification. `costMicroEur` : ce qui a déjà été facturé (à compter dans le plafond RG5). */
export class VisionError extends Error {
  constructor(
    readonly reason: VisionErrorReason,
    readonly costMicroEur: number = 0,
  ) {
    super(`Analyse IA impossible : ${reason}`);
    this.name = "VisionError";
  }
}

/** `mode` : images tirées d'un clip (par défaut) ou captures envoyées telles quelles (U34), chacun sa consigne. */
export type VisionContext = { signal?: AbortSignal; mode?: "clip" | "images" };

export interface VisionProvider {
  identify(images: readonly Buffer[], context?: VisionContext): Promise<VisionResult>;
  /** Identification d'après une description écrite (U35), même format de réponse ; le texte n'est jamais conservé. */
  identifyFromText(text: string, context?: { signal?: AbortSignal }): Promise<VisionResult>;
  /** Identification d'après les métadonnées publiques d'une publication et sa vignette éventuelle (U36). */
  identifyFromLink(link: LinkClues, context?: { signal?: AbortSignal }): Promise<VisionResult>;
}

/** Indices d'une publication : métadonnées publiques et vignette réencodée en JPEG (null si absente). */
export type LinkClues = {
  platform: "youtube" | "tiktok";
  title: string;
  description: string;
  author: string;
  tags: readonly string[];
  thumbnail: Buffer | null;
};

/** Applique les bornes : confiance entière 0 à 100, 3 alternatives au plus, rien de plus si non reconnu. */
export function normalizeAnswer(raw: ModelAnswer): VisionAnswer {
  const alternatives = raw.alternatives
    .filter((alternative) => alternative.title.trim() !== "")
    .slice(0, MAX_ALTERNATIVES)
    .map((alternative) => ({ ...alternative, title: alternative.title.trim(), confidence: clampConfidence(alternative.confidence) }));

  const title = raw.title?.trim();
  if (!raw.recognized || !title || !raw.kind) {
    return { recognized: false, confidence: 0, alternatives };
  }
  return {
    recognized: true,
    title,
    originalTitle: raw.originalTitle?.trim() || null,
    year: raw.year,
    kind: raw.kind,
    season: raw.season,
    episode: raw.episode,
    confidence: clampConfidence(raw.confidence),
    alternatives,
  };
}

function clampConfidence(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}
