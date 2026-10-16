import { describe, expect, it, vi } from "vitest";

import { CatalogError } from "../catalog-provider";
import type { TmdbGet } from "./client";
import { TmdbCatalog } from "./tmdb-catalog";

// Sans Upstash configuré, cachedJson appelle directement le chargement.
vi.mock("@/server/env", () => ({ env: {} }));

// Réponse inventée au format de `search/multi` (aucune donnée TMDB réelle stockée).
const MULTI = {
  results: [
    { media_type: "movie", id: 1, title: "Film A", original_title: "Movie A", release_date: "2001-05-02", poster_path: "/a.jpg", popularity: 12 },
    { media_type: "tv", id: 2, name: "Série B", original_name: "Show B", first_air_date: "", poster_path: null, popularity: 3 },
    { media_type: "person", id: 3, name: "Une actrice" },
    { media_type: "movie", id: "pas-un-nombre", title: "Invalide", original_title: "Invalide" },
  ],
};

function fakeGet(body: unknown): TmdbGet {
  return (async (_request, schema) => schema.parse(body)) as TmdbGet;
}

describe("TmdbCatalog.searchTitles", () => {
  it("garde films et séries valides, écarte personnes et éléments invalides", async () => {
    const catalog = new TmdbCatalog(fakeGet(MULTI));
    expect(await catalog.searchTitles("A", "fr-FR")).toEqual([
      { tmdbId: 1, mediaType: "movie", title: "Film A", originalTitle: "Movie A", year: 2001, posterPath: "/a.jpg", popularity: 12 },
      { tmdbId: 2, mediaType: "tv", title: "Série B", originalTitle: "Show B", year: null, posterPath: null, popularity: 3 },
    ]);
  });

  it("n'appelle pas TMDB pour une recherche vide", async () => {
    const get = vi.fn();
    const catalog = new TmdbCatalog(get as unknown as TmdbGet);
    expect(await catalog.searchTitles("  !! ", "fr-FR")).toEqual([]);
    expect(get).not.toHaveBeenCalled();
  });
});

describe("TmdbCatalog.getTitleDetails", () => {
  it("reprend le synopsis anglais quand le français est vide", async () => {
    const base = { id: 7, title: "Titre", original_title: "Title", release_date: "1999-01-01", genres: [{ id: 1, name: "Action" }], runtime: 120, poster_path: null, backdrop_path: null, vote_average: 7.5 };
    const get = (async (request, schema) =>
      schema.parse({ ...base, overview: request.params?.language === "fr-FR" ? "" : "English overview" })) as TmdbGet;

    const details = await new TmdbCatalog(get).getTitleDetails(7, "movie");
    expect(details).toMatchObject({ tmdbId: 7, overview: "English overview", genres: ["Action"], runtimeMinutes: 120, year: 1999 });
  });

  it("n'appelle l'anglais que si le synopsis français est vide", async () => {
    const base = { id: 8, title: "T", original_title: "T", release_date: "2000-01-01", overview: "Résumé", genres: [], runtime: 90, poster_path: null, backdrop_path: null, vote_average: 6 };
    const get = vi.fn(async (_request: unknown, schema: { parse: (value: unknown) => unknown }) => schema.parse(base));
    await new TmdbCatalog(get as unknown as TmdbGet).getTitleDetails(8, "movie");
    expect(get).toHaveBeenCalledTimes(1);
  });

  it("renvoie null pour une fiche inexistante, mais fait remonter une réponse invalide", async () => {
    const notFound = (async () => {
      throw new CatalogError("not_found");
    }) as TmdbGet;
    const invalid = (async () => {
      throw new CatalogError("invalid_response");
    }) as TmdbGet;
    expect(await new TmdbCatalog(notFound).getTitleDetails(1, "tv")).toBeNull();
    await expect(new TmdbCatalog(invalid).getTitleDetails(1, "tv")).rejects.toMatchObject({ reason: "invalid_response" });
  });
});
