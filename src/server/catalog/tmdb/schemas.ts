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

/** Élément d'une liste TMDB (`trending`, `top_rated`) : film ou série, validé élément par élément. */
export const tmdbListItemSchema = z.object({
  id: z.number().int().positive(),
  media_type: z.enum(["movie", "tv"]).optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  release_date: date,
  first_air_date: date,
  overview: z.string().catch(""),
  poster_path: nullableText,
  backdrop_path: nullableText,
  vote_average: z.number().catch(0),
  genre_ids: z.array(z.number()).catch([]),
  adult: z.boolean().catch(false),
});

export const tmdbListSchema = z.object({ results: z.array(z.unknown()) });

export const tmdbGenreListSchema = z.object({ genres: z.array(z.object({ id: z.number(), name: z.string() })) });

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

// Fiche titre (U15) : détails + `append_to_response=credits,videos,recommendations`.

const castSchema = z.object({
  id: z.number(),
  name: z.string(),
  character: z.string().nullable().optional(),
  profile_path: nullableText,
  order: z.number().catch(999),
});

const crewSchema = z.object({ id: z.number(), name: z.string(), job: z.string(), department: z.string().catch("") });

const videoSchema = z.object({
  key: z.string(),
  site: z.string(),
  type: z.string(),
  official: z.boolean().catch(false),
  iso_639_1: z.string().nullable().optional(),
});

const recommendationSchema = z.object({
  id: z.number().int().positive(),
  media_type: z.enum(["movie", "tv"]).optional(),
  title: z.string().optional(),
  name: z.string().optional(),
  release_date: date,
  first_air_date: date,
  poster_path: nullableText,
  genre_ids: z.array(z.number()).catch([]),
  popularity: z.number().catch(0),
});

const pageExtras = {
  tagline: z.string().nullable().optional(),
  vote_count: z.number().catch(0),
  credits: z.object({ cast: z.array(castSchema).catch([]), crew: z.array(crewSchema).catch([]) }).catch({ cast: [], crew: [] }),
  videos: z.object({ results: z.array(videoSchema).catch([]) }).catch({ results: [] }),
  recommendations: z.object({ results: z.array(z.unknown()).catch([]) }).catch({ results: [] }),
};

export const tmdbMoviePageSchema = tmdbMovieDetailsSchema.extend(pageExtras);
export const tmdbTvPageSchema = tmdbTvDetailsSchema.extend({
  ...pageExtras,
  number_of_seasons: z.number().nullable().optional(),
  created_by: z.array(z.object({ id: z.number(), name: z.string() })).catch([]),
});

export { recommendationSchema as tmdbRecommendationSchema };

export const tmdbPersonMovieCreditsSchema = z.object({
  crew: z
    .array(
      z.object({
        id: z.number().int().positive(),
        job: z.string(),
        title: z.string(),
        release_date: date,
        poster_path: nullableText,
        popularity: z.number().catch(0),
      }),
    )
    .catch([]),
});
