import { z } from "zod";

// Signalement d'erreur (U20) et recherche du bon titre.

export const catalogSearchResultSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  year: z.number().int().nullable(),
  posterPath: z.string().nullable(),
});

export const catalogSearchResponseSchema = z.object({ results: z.array(catalogSearchResultSchema) });

export type CatalogSearchResult = z.infer<typeof catalogSearchResultSchema>;

/** Champs texte du formulaire multipart POST /api/reports (les images arrivent à part, champ `frames`). */
export const reportFieldsSchema = z
  .object({
    identificationId: z.uuid(),
    correctedTmdbId: z.coerce.number().int().positive().max(999_999_999).optional(),
    correctedMediaType: z.enum(["movie", "tv"]).optional(),
    // Case non cochée par défaut : seule la valeur « true » vaut consentement (RG8).
    imagesConsent: z.enum(["true", "false"]).default("false"),
  })
  .refine((value) => (value.correctedTmdbId === undefined) === (value.correctedMediaType === undefined), {
    path: ["correctedTmdbId"],
  });

export const reportResponseSchema = z.object({ reportId: z.uuid(), imagesStored: z.number().int().nonnegative() });
