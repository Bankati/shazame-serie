import { describe, expect, it, vi } from "vitest";

import type { CatalogProvider, TitlePage } from "./catalog-provider";
import { resolveTitleRoute, safeDecode } from "./title-route";

vi.mock("./tmdb/tmdb-catalog", () => ({ getStaticPageCatalog: () => null }));

const MATRIX = { tmdbId: 603, mediaType: "movie", title: "Matrix" } as TitlePage;

function catalog(page: TitlePage | null): CatalogProvider {
  return { getTitlePage: vi.fn(async () => page) } as unknown as CatalogProvider;
}

describe("resolveTitleRoute", () => {
  it("renvoie la fiche à son adresse canonique", async () => {
    expect(await resolveTitleRoute(catalog(MATRIX), "film", "603-matrix")).toEqual({ status: "ok", page: MATRIX, path: "/titre/film/603-matrix" });
  });

  it.each([
    ["film", "603-mauvais-slug"],
    ["film", "603"],
  ])("redirige un slug incorrect ou absent (/titre/%s/%s) vers l'adresse canonique", async (kind, idSlug) => {
    expect(await resolveTitleRoute(catalog(MATRIX), kind, idSlug)).toEqual({ status: "redirect", path: "/titre/film/603-matrix" });
  });

  it("introuvable pour une adresse invalide, sans interroger le catalogue", async () => {
    const provider = catalog(MATRIX);
    expect(await resolveTitleRoute(provider, "anime", "603-matrix")).toEqual({ status: "not_found" });
    expect(provider.getTitlePage).not.toHaveBeenCalled();
  });

  it("introuvable quand TMDB ne connaît pas l'identifiant", async () => {
    expect(await resolveTitleRoute(catalog(null), "film", "999999-x")).toEqual({ status: "not_found" });
  });

  it("ne plante pas sur une adresse mal encodée", () => {
    expect(safeDecode("603-%E0")).toBeNull();
    expect(safeDecode("603-am%C3%A9lie")).toBe("603-amélie");
  });
});
