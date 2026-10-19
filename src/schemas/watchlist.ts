import { z } from "zod";

// Liste de suivi (U18) : un titre est identifié par son identifiant TMDB et son type.
export const watchlistItemSchema = z.object({
  tmdbId: z.number().int().positive().max(999_999_999),
  mediaType: z.enum(["movie", "tv"]),
});

export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

/** GET /api/watchlist : titres du compte (plus récents d'abord) et limite (null = illimitée). */
export const watchlistStateSchema = z.object({
  items: z.array(watchlistItemSchema),
  limit: z.number().int().positive().nullable(),
});

export type WatchlistState = z.infer<typeof watchlistStateSchema>;

/** Réponse d'un ajout ou d'un retrait : nombre de titres après l'opération. */
export const watchlistChangeSchema = z.object({ count: z.number().int().nonnegative(), limit: z.number().int().positive().nullable() });

export function watchlistKey(item: WatchlistItem): string {
  return `${item.mediaType}-${item.tmdbId}`;
}
