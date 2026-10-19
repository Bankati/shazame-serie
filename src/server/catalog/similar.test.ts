import { describe, expect, it } from "vitest";

import { buildSimilar, type SimilarCandidate } from "./similar";

function candidate(tmdbId: number, overrides: Partial<SimilarCandidate> = {}): SimilarCandidate {
  return { tmdbId, mediaType: "movie", title: `Titre ${tmdbId}`, year: 2000, posterPath: null, genreIds: [], popularity: 10, ...overrides };
}

const SELF = { tmdbId: 603, mediaType: "movie" as const, genres: [{ id: 878, name: "Science-Fiction" }, { id: 28, name: "Action" }] };

describe("buildSimilar", () => {
  it("place d'abord les films du même réalisateur (3 au plus, les plus populaires), sans le titre lui-même", () => {
    const works = [candidate(603), candidate(1, { popularity: 5 }), candidate(2, { popularity: 50 }), candidate(3, { popularity: 30 }), candidate(4, { popularity: 1 })];
    const similar = buildSimilar({ self: SELF, director: { name: "Lana Wachowski", works }, recommendations: [] });

    expect(similar.map((title) => title.tmdbId)).toEqual([2, 3, 1]);
    expect(similar[0]?.reason).toEqual({ kind: "director", name: "Lana Wachowski" });
  });

  it("explique une recommandation par le premier genre en commun, sinon « souvent associé »", () => {
    const similar = buildSimilar({
      self: SELF,
      director: null,
      recommendations: [candidate(10, { genreIds: [12, 28] }), candidate(11, { genreIds: [18] })],
    });
    expect(similar.map((title) => title.reason)).toEqual([{ kind: "genre", name: "Action" }, { kind: "related" }]);
  });

  it("ne répète pas un titre déjà proposé par le réalisateur et s'arrête à 10", () => {
    const recommendations = Array.from({ length: 15 }, (_, index) => candidate(100 + index));
    const similar = buildSimilar({
      self: SELF,
      director: { name: "X", works: [candidate(100)] },
      recommendations,
    });
    expect(similar).toHaveLength(10);
    expect(similar.filter((title) => title.tmdbId === 100)).toHaveLength(1);
    expect(similar[0]?.reason.kind).toBe("director");
  });

  it("distingue un film et une série de même identifiant", () => {
    const similar = buildSimilar({ self: SELF, director: null, recommendations: [candidate(603, { mediaType: "tv" })] });
    expect(similar).toHaveLength(1);
  });
});
