import "server-only";

import { log } from "@/server/log";

import type { CatalogGenre, CatalogProvider, ShowcaseTitle } from "./catalog-provider";

// Contenu de l'accueil (refonte sombre, 16 octobre 2026) : vedette, rangées d'affiches et genres, à partir des
// tendances TMDB. Calculé à la génération de la page (ISR), jamais dans le navigateur.

export const FEATURED_COUNT = 5;
export const ROW_MAX = 18;
const GENRE_MIN_TITLES = 3;

// Genres proposés, dans cet ordre (identifiants TMDB des films) : Science-Fiction, Action, Drame,
// Fantastique, Comédie, Horreur, Animation, Thriller.
const HOME_GENRE_IDS = [878, 28, 18, 14, 35, 27, 16, 53] as const;

export type GenreTile = { id: number; name: string; backdropPath: string | null; count: number };

export type HomeShowcase = {
  /** Titres de la vedette : tendances avec image large et synopsis. */
  featured: ShowcaseTitle[];
  trendingMovies: ShowcaseTitle[];
  trendingShows: ShowcaseTitle[];
  topRated: ShowcaseTitle[];
  genres: GenreTile[];
  /** Films parmi lesquels le filtre par genre choisit (tendances + mieux notés, sans doublon). */
  explore: ShowcaseTitle[];
};

type ShowcaseSources = {
  trendingMovies: ShowcaseTitle[];
  trendingShows: ShowcaseTitle[];
  topRated: ShowcaseTitle[];
  genres: CatalogGenre[];
};

export function buildShowcase(sources: ShowcaseSources): HomeShowcase {
  const withPoster = (titles: ShowcaseTitle[]) => titles.filter((title) => title.posterPath).slice(0, ROW_MAX);
  const trendingMovies = withPoster(sources.trendingMovies);
  const trendingShows = withPoster(sources.trendingShows);
  const topRated = withPoster(sources.topRated);

  const featured = interleave(sources.trendingMovies, sources.trendingShows)
    .filter((title) => title.backdropPath && title.overview)
    .slice(0, FEATURED_COUNT);

  const explore = dedupe([...trendingMovies, ...topRated]);
  const names = new Map(sources.genres.map((genre) => [genre.id, genre.name]));
  const genres: GenreTile[] = HOME_GENRE_IDS.flatMap((id) => {
    const name = names.get(id);
    const titles = explore.filter((title) => title.genreIds.includes(id));
    if (!name || titles.length < GENRE_MIN_TITLES) {
      return [];
    }
    return [{ id, name, backdropPath: titles.find((title) => title.backdropPath)?.backdropPath ?? null, count: titles.length }];
  });

  return { featured, trendingMovies, trendingShows, topRated, genres, explore };
}

/**
 * Contenu de l'accueil. TMDB non configuré (CI, local sans jeton) : null, l'accueil garde son hero simple.
 * TMDB en panne :
 * - pendant une régénération ISR, l'erreur remonte : Next conserve la dernière page réussie au lieu
 *   d'enregistrer une page sans vedette pour 6 heures ;
 * - pendant un build (`building`), il n'y a pas de page précédente : null (hero simple) plutôt qu'un
 *   déploiement bloqué par une panne de TMDB. La vedette revient à la régénération suivante.
 */
export async function loadHomeShowcase(
  catalog: () => CatalogProvider,
  options: { configured: boolean; building?: boolean },
): Promise<HomeShowcase | null> {
  if (!options.configured) {
    return null;
  }
  try {
    const provider = catalog();
    const [trendingMovies, trendingShows, topRated, genres] = await Promise.all([
      provider.getTrending("movie"),
      provider.getTrending("tv"),
      provider.getTopRatedMovies(),
      provider.getGenres("movie"),
    ]);
    const showcase = buildShowcase({ trendingMovies, trendingShows, topRated, genres });
    return showcase.featured.length > 0 ? showcase : null;
  } catch (error) {
    log.warn("home.showcase_unavailable", { building: options.building === true });
    if (options.building) return null;
    throw error;
  }
}

function interleave<T>(first: readonly T[], second: readonly T[]): T[] {
  const result: T[] = [];
  for (let index = 0; index < Math.max(first.length, second.length); index++) {
    if (first[index]) result.push(first[index] as T);
    if (second[index]) result.push(second[index] as T);
  }
  return result;
}

function dedupe(titles: readonly ShowcaseTitle[]): ShowcaseTitle[] {
  const seen = new Set<string>();
  return titles.filter((title) => {
    const key = `${title.mediaType}-${title.tmdbId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
