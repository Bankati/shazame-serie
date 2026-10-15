import { describe, expect, it } from "vitest";

import type { CatalogCandidate } from "./catalog-provider";
import {
  mergeCandidates,
  normalizeTitle,
  rankCandidates,
  scoreCandidate,
  titleSimilarity,
  typeScore,
  yearScore,
} from "./matching";

// Candidats inventés (aucune donnée TMDB stockée dans le dépôt, conditions TMDB 1.C).
function candidate(overrides: Partial<CatalogCandidate> & Pick<CatalogCandidate, "tmdbId" | "title">): CatalogCandidate {
  return {
    mediaType: "movie",
    originalTitle: overrides.title,
    year: 2000,
    posterPath: null,
    popularity: 10,
    ...overrides,
  };
}

describe("normalizeTitle", () => {
  it.each([
    ["L'Attaque des Titans", "attaque des titans"],
    ["Le Fabuleux Destin d'Amélie Poulain", "fabuleux destin d amelie poulain"],
    ["The Lord of the Rings: The Fellowship", "lord of the rings the fellowship"],
    ["Fast & Furious", "fast et furious"],
    ["  Ça  ", "ca"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeTitle(input)).toBe(expected);
  });
});

describe("titleSimilarity", () => {
  it("vaut 1 pour deux titres identiques une fois normalisés", () => {
    expect(titleSimilarity("Le Voyage de Chihiro", "le voyage de chihiro !")).toBe(1);
  });

  it("reste élevée pour une petite différence", () => {
    expect(titleSimilarity("Intouchable", "Intouchables")).toBeGreaterThan(0.9);
  });

  it("est faible pour deux titres sans rapport", () => {
    expect(titleSimilarity("Inception", "Le Parrain")).toBeLessThan(0.3);
  });
});

describe("yearScore et typeScore", () => {
  it.each([
    [1999, 1999, 1],
    [1999, 2000, 0.8],
    [1999, 2001, 0.4],
    [1999, 2005, 0],
    [null, 1999, null],
    [1999, null, null],
  ])("année proposée %s, réelle %s → %s", (proposed, actual, expected) => {
    expect(yearScore(proposed, actual)).toBe(expected);
  });

  it("accepte film et série pour un animé, refuse un type contraire sinon", () => {
    expect(typeScore("anime", "movie")).toBe(1);
    expect(typeScore("anime", "tv")).toBe(1);
    expect(typeScore("film", "tv")).toBe(0);
    expect(typeScore("serie", "tv")).toBe(1);
  });
});

describe("scoreCandidate", () => {
  it("retient la meilleure ressemblance entre titre français et titre original", () => {
    const match = scoreCandidate(
      { title: "Les Évadés", kind: "film", year: 1994 },
      candidate({ tmdbId: 1, title: "Les Évadés", originalTitle: "The Shawshank Redemption", year: 1994 }),
    );
    expect(match.signals.title).toBe(1);
    expect(match.quality).toBeGreaterThan(0.95);
  });

  it("répartit le poids de l'année quand elle manque", () => {
    const match = scoreCandidate({ title: "Inception", kind: "film" }, candidate({ tmdbId: 1, title: "Inception", popularity: 0 }));
    expect(match.signals.year).toBeNull();
    expect(match.quality).toBe(1);
  });
});

describe("rankCandidates", () => {
  const dune2021 = candidate({ tmdbId: 1, title: "Dune", year: 2021, popularity: 300 });
  const dune1984 = candidate({ tmdbId: 2, title: "Dune", year: 1984, popularity: 40 });

  it("départage des homonymes par l'année", () => {
    const result = rankCandidates({ title: "Dune", kind: "film", year: 1984 }, [dune2021, dune1984]);
    expect(result.status).toBe("matched");
    expect(result.status === "matched" && result.best.tmdbId).toBe(2);
  });

  it("préfère le plus populaire quand l'année manque", () => {
    const result = rankCandidates({ title: "Dune", kind: "film" }, [dune1984, dune2021]);
    expect(result.status === "matched" && result.best.tmdbId).toBe(1);
  });

  it("préfère le bon type à titre égal", () => {
    const series = candidate({ tmdbId: 3, title: "Lupin", mediaType: "tv", year: 2021 });
    const film = candidate({ tmdbId: 4, title: "Lupin", mediaType: "movie", year: 2021, popularity: 500 });
    const result = rankCandidates({ title: "Lupin", kind: "serie", year: 2021 }, [film, series]);
    expect(result.status === "matched" && result.best.tmdbId).toBe(3);
  });

  it("ne renvoie aucune correspondance quand aucun titre ne ressemble", () => {
    const result = rankCandidates({ title: "Inception", kind: "film", year: 2010 }, [
      candidate({ tmdbId: 5, title: "Le Parrain", year: 1972 }),
    ]);
    expect(result).toEqual({ status: "none", alternatives: [] });
  });

  it("supprime les doublons et limite les alternatives à 3", () => {
    const many = Array.from({ length: 6 }, (_, index) => candidate({ tmdbId: 10 + index, title: "Alien", year: 1979 + index }));
    const result = rankCandidates({ title: "Alien", kind: "film", year: 1979 }, [...many, many[0]!]);
    expect(result.status === "matched" && result.best.tmdbId).toBe(10);
    expect(result.alternatives).toHaveLength(3);
  });

  it("retrouve une série vue seulement sous son titre anglais, devant un film homonyme peu connu", () => {
    // Situation réelle (« Attack on Titan ») reproduite avec des données inventées.
    const obscureFilmFr = candidate({ tmdbId: 20, title: "Attack on Titan", year: 2022, popularity: 3 });
    const seriesEn = candidate({ tmdbId: 21, title: "Attack on Titan", originalTitle: "進撃の巨人", mediaType: "tv", year: 2013, popularity: 57 });
    const result = rankCandidates({ title: "Attack on Titan", kind: "anime" }, [obscureFilmFr, seriesEn]);
    expect(result.status === "matched" && result.best.tmdbId).toBe(21);
  });
});

describe("mergeCandidates", () => {
  it("fusionne une fiche vue en français et en anglais, en gardant le titre français", () => {
    const french = candidate({ tmdbId: 1, title: "L'Attaque des Titans", originalTitle: "進撃の巨人", mediaType: "tv", popularity: 10 });
    const english = candidate({ tmdbId: 1, title: "Attack on Titan", originalTitle: "進撃の巨人", mediaType: "tv", popularity: 57 });
    expect(mergeCandidates([french, english])).toEqual([{ ...french, otherTitles: ["Attack on Titan"], popularity: 57 }]);
  });

  it("garde séparés un film et une série de même identifiant", () => {
    const film = candidate({ tmdbId: 1, title: "A", mediaType: "movie" });
    const show = candidate({ tmdbId: 1, title: "A", mediaType: "tv" });
    expect(mergeCandidates([film, show])).toHaveLength(2);
  });
});
