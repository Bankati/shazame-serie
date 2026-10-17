import { afterEach, describe, expect, it, vi } from "vitest";

import type { CatalogProvider, ShowcaseTitle } from "./catalog-provider";
import { buildShowcase, FEATURED_COUNT, loadHomeShowcase, ROW_MAX } from "./home-showcase";
import { toShowcaseTitle } from "./tmdb/tmdb-catalog";

let nextId = 1;
function title(overrides: Partial<ShowcaseTitle> = {}): ShowcaseTitle {
  const id = nextId++;
  return {
    tmdbId: id,
    mediaType: "movie",
    title: `Titre ${id}`,
    year: 2026,
    overview: "Synopsis.",
    posterPath: `/p${id}.jpg`,
    backdropPath: `/b${id}.jpg`,
    voteAverage: 7.5,
    genreIds: [878],
    ...overrides,
  };
}

const GENRES = [
  { id: 878, name: "Science-Fiction" },
  { id: 28, name: "Action" },
  { id: 18, name: "Drame" },
];

afterEach(() => {
  vi.restoreAllMocks();
});

describe("buildShowcase", () => {
  it("vedette : films et séries en alternance, seulement avec image large et synopsis", () => {
    const movies = [title(), title({ backdropPath: null }), title()];
    const shows = [title({ mediaType: "tv" }), title({ mediaType: "tv", overview: "" }), title({ mediaType: "tv" })];
    const { featured } = buildShowcase({ trendingMovies: movies, trendingShows: shows, topRated: [], genres: GENRES });
    expect(featured.map((item) => item.tmdbId)).toEqual([movies[0], shows[0], movies[2], shows[2]].map((item) => item?.tmdbId));
    expect(featured.length).toBeLessThanOrEqual(FEATURED_COUNT);
  });

  it("rangées : sans affiche écartées, limitées à 18", () => {
    const many = Array.from({ length: 25 }, () => title());
    const showcase = buildShowcase({ trendingMovies: [title({ posterPath: null }), ...many], trendingShows: [], topRated: [], genres: GENRES });
    expect(showcase.trendingMovies).toHaveLength(ROW_MAX);
    expect(showcase.trendingMovies.every((item) => item.posterPath)).toBe(true);
  });

  it("genres : au moins 3 films, image tirée d'un film du genre, sans doublon entre tendances et mieux notés", () => {
    const shared = title({ genreIds: [28] });
    const showcase = buildShowcase({
      trendingMovies: [title(), title(), title(), shared, title({ genreIds: [28] })],
      trendingShows: [],
      topRated: [shared, title({ genreIds: [28] }), title({ genreIds: [18] })],
      genres: GENRES,
    });
    expect(showcase.genres.map((genre) => [genre.name, genre.count])).toEqual([
      ["Science-Fiction", 3],
      ["Action", 3],
    ]);
    expect(showcase.explore.filter((item) => item.tmdbId === shared.tmdbId)).toHaveLength(1);
  });
});

describe("toShowcaseTitle", () => {
  it("valide un élément TMDB et écarte les contenus réservés aux adultes ou sans titre", () => {
    const valid = { id: 603, title: "Matrix", release_date: "1999-03-31", overview: "Neo…", poster_path: "/m.jpg", backdrop_path: "/b.jpg", vote_average: 8.2, genre_ids: [28, 878] };
    expect(toShowcaseTitle(valid, "movie")).toEqual([
      { tmdbId: 603, mediaType: "movie", title: "Matrix", year: 1999, overview: "Neo…", posterPath: "/m.jpg", backdropPath: "/b.jpg", voteAverage: 8.2, genreIds: [28, 878] },
    ]);
    expect(toShowcaseTitle({ ...valid, adult: true }, "movie")).toEqual([]);
    expect(toShowcaseTitle({ id: 1 }, "movie")).toEqual([]);
    expect(toShowcaseTitle({ id: 1396, name: "Breaking Bad", first_air_date: "2008-01-20" }, "tv")[0]).toMatchObject({ mediaType: "tv", year: 2008 });
  });
});

describe("loadHomeShowcase", () => {
  it("TMDB indisponible : null (l'accueil garde son hero simple)", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = () => {
      throw new Error("pas de jeton");
    };
    expect(await loadHomeShowcase(failing as () => CatalogProvider)).toBeNull();
  });
});
