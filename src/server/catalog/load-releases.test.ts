import { describe, expect, it, vi } from "vitest";

import type { CatalogProvider } from "./catalog-provider";
import { loadReleases } from "./load-releases";

vi.mock("server-only", () => ({}));
vi.mock("@/server/log", () => ({ log: { warn: vi.fn() } }));

function catalogWith(getReleases: CatalogProvider["getReleases"]): () => CatalogProvider {
  return () => ({ getReleases }) as unknown as CatalogProvider;
}

describe("loadReleases (U42)", () => {
  it("TMDB non configuré : null sans appel", async () => {
    const getReleases = vi.fn();
    expect(await loadReleases(catalogWith(getReleases), "upcoming_movies", { configured: false })).toBeNull();
    expect(getReleases).not.toHaveBeenCalled();
  });

  it("TMDB en panne : null au lieu d'une erreur", async () => {
    const getReleases = vi.fn().mockRejectedValue(new Error("down"));
    expect(await loadReleases(catalogWith(getReleases), "airing_series", { configured: true })).toBeNull();
  });

  it("renvoie les sorties du catalogue", async () => {
    const getReleases = vi.fn().mockResolvedValue([]);
    expect(await loadReleases(catalogWith(getReleases), "airing_series", { configured: true })).toEqual([]);
    expect(getReleases).toHaveBeenCalledWith("airing_series");
  });
});
