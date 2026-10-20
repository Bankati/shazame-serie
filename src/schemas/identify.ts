import { z } from "zod";

// Contrat de POST /api/identify et GET /api/quota, partagé entre le serveur (construction) et le navigateur
// (validation de la réponse avant affichage).

export const identifiedTitleSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  year: z.number().int().nullable(),
  posterPath: z.string().nullable(),
  /** Confiance finale affichée, 0 à 100. */
  confidence: z.number().int().min(0).max(100),
});

export const quotaInfoSchema = z.object({
  limit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  resetAt: z.iso.datetime(),
});

export const identifyResponseSchema = z.object({
  decision: z.enum(["show", "show_with_alternatives", "ask_another_clip"]),
  source: z.enum(["ai", "cache"]),
  main: identifiedTitleSchema.nullable(),
  alternatives: z.array(identifiedTitleSchema),
  quota: quotaInfoSchema,
  // Identifiant de l'identification enregistrée (U20 : signalement d'erreur), null si l'écriture a échoué.
  identificationId: z.uuid().nullable().default(null),
});

export type IdentifiedTitle = z.infer<typeof identifiedTitleSchema>;
export type QuotaInfo = z.infer<typeof quotaInfoSchema>;
export type IdentifyResponse = z.infer<typeof identifyResponseSchema>;
