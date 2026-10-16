import "server-only";

import { z } from "zod";

// Schémas des réponses TMDB v3 utilisées (https://developer.themoviedb.org/reference). Aucune réponse
// TMDB n'est utilisée sans passer par l'un d'eux (critère de fin de U08). Seuls les champs lus sont décrits.

const nullableText = z.string().nullable().optional();
const date = z.string().optional().nullable(); // "" ou "AAAA-MM-JJ"

export const tmdbMovieResultSchema = z.object({
  media_type: z.literal("movie"),
  id: z.number().int().positive(),
  title: z.string(),
  original_title: z.string(),
  release_date: date,
  poster_path: nullableText,
  popularity: z.number().nonnegative().catch(0),
});

export const tmdbTvResultSchema = z.object({
  media_type: z.literal("tv"),
  id: z.number().int().positive(),
  name: z.string(),
  original_name: z.string(),
  first_air_date: date,
  poster_path: nullableText,
  popularity: z.number().nonnegative().catch(0),
});

/** Les résultats de `search/multi` mêlent films, séries et personnes : chaque élément est validé à part. */
export const tmdbMultiSearchSchema = z.object({
  results: z.array(z.unknown()),
});

const genre = z.object({ id: z.number(), name: z.string() });

export const tmdbMovieDetailsSchema = z.object({
  id: z.number().int().positive(),
  title: z.string(),
  original_title: z.string(),
  release_date: date,
  overview: z.string().catch(""),
  genres: z.array(genre).catch([]),
  runtime: z.number().nullable().optional(),
  poster_path: nullableText,
  backdrop_path: nullableText,
  vote_average: z.number().catch(0),
});

export const tmdbTvDetailsSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  original_name: z.string(),
  first_air_date: date,
  overview: z.string().catch(""),
  genres: z.array(genre).catch([]),
  episode_run_time: z.array(z.number()).catch([]),
  poster_path: nullableText,
  backdrop_path: nullableText,
  vote_average: z.number().catch(0),
});

export const tmdbConfigurationSchema = z.object({
  images: z.object({
    secure_base_url: z.url({ protocol: /^https$/ }),
    poster_sizes: z.array(z.string()),
    backdrop_sizes: z.array(z.string()),
  }),
});

/** Année d'une date TMDB (« 1999-03-30 » → 1999, « » → null). */
export function yearOf(value: string | null | undefined): number | null {
  const year = Number.parseInt(value?.slice(0, 4) ?? "", 10);
  return Number.isFinite(year) && year > 1800 ? year : null;
}
