import { describe, expect, it } from "vitest";

import { parseTitlePath, slugify, titlePath } from "./title-url";

describe("slugify", () => {
  it.each([
    ["Matrix", "matrix"],
    ["Le Fabuleux Destin d'Amélie Poulain", "le-fabuleux-destin-d-amelie-poulain"],
    ["Fast & Furious", "fast-et-furious"],
    ["  L'Attaque des Titans !  ", "l-attaque-des-titans"],
    ["千と千尋の神隠し", "titre"],
  ])("%s → %s", (title, slug) => {
    expect(slugify(title)).toBe(slug);
  });

  it("limite la longueur sans finir par un tiret", () => {
    const slug = slugify("a ".repeat(100));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("titlePath", () => {
  it("construit l'adresse française d'un film et d'une série (AD-09)", () => {
    expect(titlePath("movie", 603, "Matrix")).toBe("/titre/film/603-matrix");
    expect(titlePath("tv", 1396, "Breaking Bad")).toBe("/titre/serie/1396-breaking-bad");
  });
});

describe("parseTitlePath", () => {
  it.each([
    ["film", "603-matrix", { mediaType: "movie", tmdbId: 603, slug: "matrix" }],
    ["serie", "1396", { mediaType: "tv", tmdbId: 1396, slug: null }],
    ["film", "603-mauvais-slug", { mediaType: "movie", tmdbId: 603, slug: "mauvais-slug" }],
  ])("/titre/%s/%s", (kind, idSlug, expected) => {
    expect(parseTitlePath(kind, idSlug)).toEqual(expected);
  });

  it.each([
    ["anime", "603-x"],
    ["film", "matrix"],
    ["film", "0-zero"],
    ["film", "-603"],
    ["film", "9999999999-trop-long"],
  ])("refuse /titre/%s/%s", (kind, idSlug) => {
    expect(parseTitlePath(kind, idSlug)).toBeNull();
  });
});
