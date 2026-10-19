import { describe, expect, it } from "vitest";

import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";

// Critère de fin de U15 : fiche valide pour un film et pour une série (données TMDB réelles).
describe("fiche titre TMDB en direct", () => {
  it("film : Matrix (1999)", async () => {
    const page = await getCatalog().getTitlePage(603, "movie");
    console.info(JSON.stringify({ ...page, cast: page?.cast.slice(0, 2), similar: page?.similar.slice(0, 4) }));
    expect(page).toMatchObject({ tmdbId: 603, mediaType: "movie", year: 1999 });
    expect(page?.directors.length).toBeGreaterThan(0);
    expect(page?.cast.length).toBeGreaterThan(3);
    expect(page?.overview.length).toBeGreaterThan(20);
    expect(page?.similar.length).toBeGreaterThanOrEqual(5);
    expect(page?.similar.some((title) => title.reason.kind === "director")).toBe(true);
  });

  it("série : Breaking Bad (2008)", async () => {
    const page = await getCatalog().getTitlePage(1396, "tv");
    console.info(JSON.stringify({ title: page?.title, seasons: page?.seasons, directors: page?.directors, trailerKey: page?.trailerKey, similar: page?.similar.slice(0, 3) }));
    expect(page).toMatchObject({ tmdbId: 1396, mediaType: "tv", year: 2008 });
    expect(page?.seasons).toBeGreaterThan(1);
    expect(page?.directors).toContain("Vince Gilligan");
    expect(page?.similar.length).toBeGreaterThanOrEqual(5);
  });

  it("identifiant inexistant : null", async () => {
    expect(await getCatalog().getTitlePage(999_999_999, "movie")).toBeNull();
  });
});
