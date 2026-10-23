import "server-only";

import { z } from "zod";

import { cachedJson } from "@/server/cache/redis";
import { env } from "@/server/env";

import {
  type CatalogCandidate,
  CatalogError,
  type CatalogGenre,
  type CatalogImageConfig,
  type CatalogLanguage,
  type CatalogProvider,
  type CatalogTitleDetails,
  type MediaType,
  type ReleaseKind,
  type ReleaseTitle,
  type ShowcaseTitle,
  type TitlePage,
} from "../catalog-provider";
import { normalizeTitle } from "../matching";
import { buildSimilar, type SimilarCandidate } from "../similar";
import { createTmdbClient, type TmdbGet } from "./client";
import {
  tmdbConfigurationSchema,
  tmdbGenreListSchema,
  tmdbListItemSchema,
  tmdbListSchema,
  tmdbMovieDetailsSchema,
  tmdbMovieResultSchema,
  tmdbMoviePageSchema,
  tmdbMultiSearchSchema,
  tmdbPersonMovieCreditsSchema,
  tmdbRecommendationSchema,
  tmdbTvDetailsSchema,
  tmdbTvPageSchema,
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

const MAX_CAST = 10;
const MAX_WRITERS = 3;
const WRITING_JOBS = new Set(["Screenplay", "Writer", "Story", "Novel"]);
const YOUTUBE_KEY = /^[\w-]{6,20}$/;

const showcaseSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  year: z.number().int().nullable(),
  overview: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  voteAverage: z.number(),
  genreIds: z.array(z.number()),
});

const releaseSchema = showcaseSchema.extend({ releaseDate: z.string().nullable() });

const genreSchema = z.object({ id: z.number(), name: z.string() });

const titlePageSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(["movie", "tv"]),
  title: z.string(),
  originalTitle: z.string(),
  year: z.number().int().nullable(),
  tagline: z.string().nullable(),
  overview: z.string(),
  genres: z.array(z.string()),
  runtimeMinutes: z.number().nullable(),
  seasons: z.number().nullable(),
  voteAverage: z.number(),
  voteCount: z.number(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  directors: z.array(z.string()),
  writers: z.array(z.string()),
  cast: z.array(z.object({ id: z.number(), name: z.string(), character: z.string().nullable(), profilePath: z.string().nullable() })),
  trailerKey: z.string().nullable(),
  similar: z.array(
    z.object({
      tmdbId: z.number().int().positive(),
      mediaType: z.enum(["movie", "tv"]),
      title: z.string(),
      year: z.number().int().nullable(),
      posterPath: z.string().nullable(),
      reason: z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("director"), name: z.string() }),
        z.object({ kind: z.literal("genre"), name: z.string() }),
        z.object({ kind: z.literal("related") }),
      ]),
    }),
  ),
});

const imageConfigSchema = z.object({
  secureBaseUrl: z.string(),
  posterSizes: z.array(z.string()),
  backdropSizes: z.array(z.string()),
});

export type TmdbCatalogOptions = {
  /**
   * Cache Redis des réponses (identification, routes dynamiques). À désactiver dans les pages mises en cache
   * par Next (ISR : fiches, sitemap) : le client Upstash appelle `fetch` en `no-store`, ce que Next refuse
   * pendant la génération d'une page statique (« Page changed from static to dynamic »). Next met alors
   * lui-même en cache la page et les réponses TMDB.
   */
  redisCache: boolean;
};

export class TmdbCatalog implements CatalogProvider {
  constructor(
    private readonly get: TmdbGet,
    private readonly options: TmdbCatalogOptions = { redisCache: true },
  ) {}

  private cached<T>(key: string, schema: z.ZodType<T>, load: () => Promise<T>): Promise<T> {
    return this.options.redisCache ? cachedJson(key, CACHE_TTL_S, schema, load) : load();
  }

  async searchTitles(query: string, language: CatalogLanguage): Promise<CatalogCandidate[]> {
    const normalized = normalizeTitle(query);
    if (!normalized) {
      return [];
    }
    return this.cached(`tmdb:search:${language}:${normalized}`, z.array(candidateSchema), async () => {
      const page = await this.get(
        { path: "/search/multi", params: { query, language, include_adult: false, page: 1 } },
        tmdbMultiSearchSchema,
      );
      return page.results.flatMap(toCandidate);
    });
  }

  async getTitleDetails(tmdbId: number, mediaType: MediaType): Promise<CatalogTitleDetails | null> {
    return this.cached(`tmdb:details:${mediaType}:${tmdbId}`, detailsSchema.nullable(), async () => {
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
    return this.cached("tmdb:configuration", imageConfigSchema, async () => {
      const { images } = await this.get({ path: "/configuration" }, tmdbConfigurationSchema);
      return { secureBaseUrl: images.secure_base_url, posterSizes: images.poster_sizes, backdropSizes: images.backdrop_sizes };
    });
  }

  async getTrending(mediaType: MediaType): Promise<ShowcaseTitle[]> {
    return this.cached(`tmdb:trending:${mediaType}`, z.array(showcaseSchema), async () => {
      const page = await this.get({ path: `/trending/${mediaType}/week`, params: { language: "fr-FR" } }, tmdbListSchema);
      return page.results.flatMap((item) => toShowcaseTitle(item, mediaType));
    });
  }

  async getTopRatedMovies(): Promise<ShowcaseTitle[]> {
    return this.cached("tmdb:top_rated:movie", z.array(showcaseSchema), async () => {
      const page = await this.get({ path: "/movie/top_rated", params: { language: "fr-FR", region: "FR", page: 1 } }, tmdbListSchema);
      return page.results.flatMap((item) => toShowcaseTitle(item, "movie"));
    });
  }

  /**
   * Calendrier (U42) : `movie/upcoming` (région France, triés par date de sortie) ou `tv/on_the_air` (séries
   * diffusées cette semaine). Même cache et même validation que les tendances.
   */
  async getReleases(kind: ReleaseKind): Promise<ReleaseTitle[]> {
    return this.cached(`tmdb:releases:${kind}`, z.array(releaseSchema), async () => {
      const movies = kind === "upcoming_movies";
      const page = await this.get(
        movies
          ? { path: "/movie/upcoming", params: { language: "fr-FR", region: "FR", page: 1 } }
          : { path: "/tv/on_the_air", params: { language: "fr-FR", page: 1 } },
        tmdbListSchema,
      );
      const titles = page.results.flatMap((item) => toReleaseTitle(item, movies ? "movie" : "tv"));
      return movies ? titles.sort((a, b) => (a.releaseDate ?? "9999").localeCompare(b.releaseDate ?? "9999")) : titles;
    });
  }

  async getGenres(mediaType: MediaType): Promise<CatalogGenre[]> {
    return this.cached(`tmdb:genres:${mediaType}`, z.array(genreSchema), async () => {
      const { genres } = await this.get({ path: `/genre/${mediaType}/list`, params: { language: "fr-FR" } }, tmdbGenreListSchema);
      return genres;
    });
  }

  async getTitlePage(tmdbId: number, mediaType: MediaType): Promise<TitlePage | null> {
    return this.cached(`tmdb:page:${mediaType}:${tmdbId}`, titlePageSchema.nullable(), async () => {
      try {
        return await this.fetchTitlePage(tmdbId, mediaType);
      } catch (error) {
        if (error instanceof CatalogError && error.reason === "not_found") {
          return null;
        }
        throw error;
      }
    });
  }

  private async fetchTitlePage(tmdbId: number, mediaType: MediaType): Promise<TitlePage> {
    const params = { language: "fr-FR", append_to_response: "credits,videos,recommendations", include_video_language: "fr,en" };
    const raw =
      mediaType === "movie"
        ? await this.get({ path: `/movie/${tmdbId}`, params }, tmdbMoviePageSchema)
        : await this.get({ path: `/tv/${tmdbId}`, params }, tmdbTvPageSchema);

    const base =
      "title" in raw
        ? { title: raw.title, originalTitle: raw.original_title, year: yearOf(raw.release_date), runtimeMinutes: raw.runtime ?? null, seasons: null }
        : {
            title: raw.name,
            originalTitle: raw.original_name,
            year: yearOf(raw.first_air_date),
            runtimeMinutes: raw.episode_run_time[0] ?? null,
            seasons: raw.number_of_seasons ?? null,
          };

    const crew = raw.credits.crew;
    const directorsWithId =
      "created_by" in raw
        ? raw.created_by.map((person) => ({ id: person.id, name: person.name }))
        : crew.filter((person) => person.job === "Director").map((person) => ({ id: person.id, name: person.name }));
    const writers = unique(crew.filter((person) => WRITING_JOBS.has(person.job)).map((person) => person.name)).slice(0, MAX_WRITERS);

    // Synopsis vide en français : repli sur l'anglais (library-docs.md).
    const overview =
      raw.overview || (await this.fetchDetails(tmdbId, mediaType, "en-US").then((english) => english.overview).catch(() => ""));

    const firstDirector = directorsWithId[0];
    const director =
      mediaType === "movie" && firstDirector ? await this.directorWorks(firstDirector.id, firstDirector.name).catch(() => null) : null;

    return {
      tmdbId: raw.id,
      mediaType,
      ...base,
      tagline: raw.tagline || null,
      overview,
      genres: raw.genres.map((genre) => genre.name),
      voteAverage: raw.vote_average,
      voteCount: raw.vote_count,
      posterPath: raw.poster_path ?? null,
      backdropPath: raw.backdrop_path ?? null,
      directors: unique(directorsWithId.map((person) => person.name)),
      writers,
      cast: [...raw.credits.cast]
        .sort((a, b) => a.order - b.order)
        .slice(0, MAX_CAST)
        .map((person) => ({ id: person.id, name: person.name, character: person.character || null, profilePath: person.profile_path ?? null })),
      trailerKey: pickTrailer(raw.videos.results),
      similar: buildSimilar({
        self: { tmdbId: raw.id, mediaType, genres: raw.genres },
        director,
        recommendations: raw.recommendations.results.flatMap((item) => toSimilarCandidate(item, mediaType)),
      }),
    };
  }

  /** Autres films réalisés par la même personne (« Même réalisateur »). */
  private async directorWorks(personId: number, name: string): Promise<{ name: string; works: SimilarCandidate[] }> {
    const credits = await this.get(
      { path: `/person/${personId}/movie_credits`, params: { language: "fr-FR" } },
      tmdbPersonMovieCreditsSchema,
    );
    const works = credits.crew
      .filter((work) => work.job === "Director")
      .map((work) => ({
        tmdbId: work.id,
        mediaType: "movie" as const,
        title: work.title,
        year: yearOf(work.release_date),
        posterPath: work.poster_path ?? null,
        genreIds: [],
        popularity: work.popularity,
      }));
    return { name, works };
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

/** Élément d'une liste TMDB validé ; écarté s'il est invalide, réservé aux adultes ou sans titre. */
export function toShowcaseTitle(item: unknown, fallbackType: MediaType): ShowcaseTitle[] {
  const parsed = tmdbListItemSchema.safeParse(item);
  if (!parsed.success || parsed.data.adult) {
    return [];
  }
  const value = parsed.data;
  const title = value.title ?? value.name;
  if (!title) {
    return [];
  }
  return [
    {
      tmdbId: value.id,
      mediaType: value.media_type ?? fallbackType,
      title,
      year: yearOf(value.release_date ?? value.first_air_date),
      overview: value.overview,
      posterPath: value.poster_path ?? null,
      backdropPath: value.backdrop_path ?? null,
      voteAverage: value.vote_average,
      genreIds: value.genre_ids,
    },
  ];
}

/** Élément du calendrier : comme une tendance, avec la date complète (« » de TMDB ramené à null). */
export function toReleaseTitle(item: unknown, fallbackType: MediaType): ReleaseTitle[] {
  const parsed = tmdbListItemSchema.safeParse(item);
  const [title] = toShowcaseTitle(item, fallbackType);
  if (!title || !parsed.success) {
    return [];
  }
  const date = parsed.data.release_date || parsed.data.first_air_date || null;
  return [{ ...title, releaseDate: date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null }];
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

type TmdbVideo = { key: string; site: string; type: string; official: boolean; iso_639_1?: string | null };

/** Bande-annonce YouTube : française si possible, puis officielle, puis la première. */
function pickTrailer(videos: readonly TmdbVideo[]): string | null {
  const trailers = videos.filter((video) => video.site === "YouTube" && video.type === "Trailer" && YOUTUBE_KEY.test(video.key));
  const score = (video: TmdbVideo) => (video.iso_639_1 === "fr" ? 2 : 0) + (video.official ? 1 : 0);
  return [...trailers].sort((a, b) => score(b) - score(a))[0]?.key ?? null;
}

function toSimilarCandidate(item: unknown, fallbackType: MediaType): SimilarCandidate[] {
  const parsed = tmdbRecommendationSchema.safeParse(item);
  if (!parsed.success) {
    return [];
  }
  const value = parsed.data;
  const title = value.title ?? value.name;
  if (!title) {
    return [];
  }
  return [
    {
      tmdbId: value.id,
      mediaType: value.media_type ?? fallbackType,
      title,
      year: yearOf(value.release_date ?? value.first_air_date),
      posterPath: value.poster_path ?? null,
      genreIds: value.genre_ids,
      popularity: value.popularity,
    },
  ];
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

let catalog: TmdbCatalog | undefined;
let staticCatalog: TmdbCatalog | undefined;

function token(): string {
  if (!env.TMDB_API_TOKEN) {
    throw new CatalogError("unavailable");
  }
  return env.TMDB_API_TOKEN;
}

/** TMDB est-il configuré (jeton présent) ? Absent en CI et en local sans clé. */
export function isCatalogConfigured(): boolean {
  return Boolean(env.TMDB_API_TOKEN);
}

/** Catalogue applicatif (cache Redis) ; lève si TMDB n'est pas configuré. */
export function getCatalog(): TmdbCatalog {
  catalog ??= new TmdbCatalog(createTmdbClient({ token: token(), baseUrl: env.TMDB_API_BASE_URL }));
  return catalog;
}

/** Catalogue des pages mises en cache par Next (fiches, sitemap) : sans Redis, Next met en cache lui-même. */
export function getStaticPageCatalog(): TmdbCatalog {
  staticCatalog ??= new TmdbCatalog(createTmdbClient({ token: token(), baseUrl: env.TMDB_API_BASE_URL }), { redisCache: false });
  return staticCatalog;
}
