import { afterEach, describe, expect, it, vi } from "vitest";

import { createMemoryLimiter } from "@/server/http/attempt-limiter";

import type { CatalogProvider } from "./catalog-provider";
import { handleCatalogSearch } from "./search-request";

const MATRIX = { tmdbId: 603, mediaType: "movie" as const, title: "Matrix", originalTitle: "The Matrix", year: 1999, posterPath: "/m.jpg", popularity: 90 };

function catalog(searchTitles: CatalogProvider["searchTitles"]) {
  return () => ({ searchTitles }) as unknown as CatalogProvider;
}

const request = (q: string) => new Request(`https://site.example/api/catalog/search?q=${encodeURIComponent(q)}`);

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/catalog/search", () => {
  it("renvoie les titres trouvés en français, sans les champs internes", async () => {
    const search = vi.fn(async () => [MATRIX]);
    const response = await handleCatalogSearch(request(" matrix "), { limiter: createMemoryLimiter(30, 60_000), catalog: catalog(search) });
    expect(search).toHaveBeenCalledWith("matrix", "fr-FR");
    expect((await response.json()).data.results).toEqual([{ tmdbId: 603, mediaType: "movie", title: "Matrix", year: 1999, posterPath: "/m.jpg" }]);
  });

  it("requête trop courte : refusée sans appel au catalogue", async () => {
    const search = vi.fn(async () => []);
    expect((await handleCatalogSearch(request("m"), { limiter: createMemoryLimiter(30, 60_000), catalog: catalog(search) })).status).toBe(400);
    expect(search).not.toHaveBeenCalled();
  });

  it("31e recherche dans la minute : refusée ; catalogue en panne : 502", async () => {
    const limiter = createMemoryLimiter(30, 60_000);
    const search = vi.fn(async () => []);
    for (let index = 0; index < 30; index++) await handleCatalogSearch(request("matrix"), { limiter, catalog: catalog(search) });
    expect((await handleCatalogSearch(request("matrix"), { limiter, catalog: catalog(search) })).status).toBe(429);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const failing = catalog(async () => {
      throw new Error("panne");
    });
    expect((await handleCatalogSearch(request("matrix"), { limiter: createMemoryLimiter(30, 60_000), catalog: failing })).status).toBe(502);
  });
});
