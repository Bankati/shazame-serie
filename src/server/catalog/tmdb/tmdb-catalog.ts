import "server-only";

import { z } from "zod";

import { cachedJson } from "@/server/cache/redis";
import { env } from "@/server/env";

import {
  type CatalogCandidate,
  CatalogError,
  type CatalogImageConfig,
  type CatalogLanguage,
  type CatalogProvider,
  type CatalogTitleDetails,
  type MediaType,
} from "../catalog-provider";
import { normalizeTitle } from "../matching";
import { createTmdbClient, type TmdbGet } from "./client";
import {
  tmdbConfigurationSchema,
  tmdbMovieDetailsSchema,
  tmdbMovieResultSchema,
  tmdbMultiSearchSchema,
  tmdbTvDetailsSchema,
  tmdbTvResultSchema,
  yearOf,
} from "./schemas";

// Implémentation TMDB du catalogue. Réponses mises en cache 7 jours : bien en dessous des 6 mois
// autorisés par les conditions TMDB (section 1.C), et assez court pour suivre les mises à jour des fiches.
const CACHE_TTL_S = 7 * 24 * 60 * 60;

const candidateSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  originalTitle: z.string(),
  year: z.number().int().nullable(),
  posterPath: z.string().nullable(),
  popularity: z.number(),
});

const detailsSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  originalTitle: z.string(),
  year: z.number().int().nullable(),
  overview: z.string(),
  genres: z.array(z.string()),
  runtimeMinutes: z.number().nullable(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  voteAverage: z.number(),
});

const imageConfigSchema = z.object({
  secureBaseUrl: z.string(),
  posterSizes: z.array(z.string()),
  backdropSizes: z.array(z.string()),
});

export class TmdbCatalog implements CatalogProvider {
  constructor(private readonly get: TmdbGet) {}

  async searchTitles(query: string, language: CatalogLanguage): Promise<CatalogCandidate[]> {
    const normalized = normalizeTitle(query);
    if (!normalized) {
      return [];
    }
    return cachedJson(`tmdb:search:${language}:${normalized}`, CACHE_TTL_S, z.array(candidateSchema), async () => {
      const page = await this.get(
        { path: "/search/multi", params: { query, language, include_adult: false, page: 1 } },
        tmdbMultiSearchSchema,
      );
      return page.results.flatMap(toCandidate);
    });
  }

  async getTitleDetails(tmdbId: number, mediaType: MediaType): Promise<CatalogTitleDetails | null> {
    return cachedJson(`tmdb:details:${mediaType}:${tmdbId}`, CACHE_TTL_S, detailsSchema.nullable(), async () => {
      try {
        const french = await this.fetchDetails(tmdbId, mediaType, "fr-FR");
        if (french.overview) {
          return french;
        }
        // Synopsis vide en français : repli sur l'anglais (library-docs.md), seulement dans ce cas.
        const english = await this.fetchDetails(tmdbId, mediaType, "en-US");
        return { ...french, overview: english.overview };
      } catch (error) {
        // Seule une fiche inexistante est mise en cache comme absente ; une panne ou une réponse invalide remonte.
        if (error instanceof CatalogError && error.reason === "not_found") {
          return null;
        }
        throw error;
      }
    });
  }

  async getImageConfig(): Promise<CatalogImageConfig> {
    return cachedJson("tmdb:configuration", CACHE_TTL_S, imageConfigSchema, async () => {
      const { images } = await this.get({ path: "/configuration" }, tmdbConfigurationSchema);
      return { secureBaseUrl: images.secure_base_url, posterSizes: images.poster_sizes, backdropSizes: images.backdrop_sizes };
    });
  }

  private async fetchDetails(tmdbId: number, mediaType: MediaType, language: CatalogLanguage): Promise<CatalogTitleDetails> {
    if (mediaType === "movie") {
      const movie = await this.get({ path: `/movie/${tmdbId}`, params: { language } }, tmdbMovieDetailsSchema);
      return {
        tmdbId: movie.id,
        mediaType,
        title: movie.title,
        originalTitle: movie.original_title,
        year: yearOf(movie.release_date),
        overview: movie.overview,
        genres: movie.genres.map((genre) => genre.name),
        runtimeMinutes: movie.runtime ?? null,
        posterPath: movie.poster_path ?? null,
        backdropPath: movie.backdrop_path ?? null,
        voteAverage: movie.vote_average,
      };
    }
    const show = await this.get({ path: `/tv/${tmdbId}`, params: { language } }, tmdbTvDetailsSchema);
    return {
      tmdbId: show.id,
      mediaType,
      title: show.name,
      originalTitle: show.original_name,
      year: yearOf(show.first_air_date),
      overview: show.overview,
      genres: show.genres.map((genre) => genre.name),
      runtimeMinutes: show.episode_run_time[0] ?? null,
      posterPath: show.poster_path ?? null,
      backdropPath: show.backdrop_path ?? null,
      voteAverage: show.vote_average,
    };
  }
}

/** Un élément de `search/multi` validé, ou rien (personnes et éléments invalides sont écartés). */
function toCandidate(item: unknown): CatalogCandidate[] {
  const movie = tmdbMovieResultSchema.safeParse(item);
  if (movie.success) {
    const value = movie.data;
    return [
      {
        tmdbId: value.id,
        mediaType: "movie",
        title: value.title,
        originalTitle: value.original_title,
        year: yearOf(value.release_date),
        posterPath: value.poster_path ?? null,
        popularity: value.popularity,
      },
    ];
  }
  const show = tmdbTvResultSchema.safeParse(item);
  if (show.success) {
    const value = show.data;
    return [
      {
        tmdbId: value.id,
        mediaType: "tv",
        title: value.name,
        originalTitle: value.original_name,
        year: yearOf(value.first_air_date),
        posterPath: value.poster_path ?? null,
        popularity: value.popularity,
      },
    ];
  }
  return [];
}

let catalog: TmdbCatalog | undefined;

/** Catalogue applicatif ; lève si TMDB n'est pas configuré. */
export function getCatalog(): TmdbCatalog {
  if (!catalog) {
    if (!env.TMDB_API_TOKEN) {
      throw new CatalogError("unavailable");
    }
    catalog = new TmdbCatalog(createTmdbClient({ token: env.TMDB_API_TOKEN }));
  }
  return catalog;
}
