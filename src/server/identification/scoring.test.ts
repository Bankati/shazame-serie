import { describe, expect, it } from "vitest";

import type { MatchResult, TitleMatch } from "@/server/catalog/matching";

import { decide, finalConfidence, scoreIdentification, type ScoringCandidate } from "./scoring";

function matched(tmdbId: number, quality: number, overrides: Partial<TitleMatch> = {}): MatchResult {
  const best: TitleMatch = {
    tmdbId,
    mediaType: "movie",
    title: `Titre ${tmdbId}`,
    originalTitle: `Title ${tmdbId}`,
    year: 2000,
    posterPath: null,
    popularity: 10,
    quality,
    signals: { title: 1, year: 1, type: 1 },
    ...overrides,
  };
  return { status: "matched", best, alternatives: [] };
}

const NONE: MatchResult = { status: "none", alternatives: [] };

function candidate(aiConfidence: number, match: MatchResult): ScoringCandidate {
  return { aiConfidence, match };
}

describe("finalConfidence", () => {
  it("garde la confiance de l'IA pour un rapprochement parfait", () => {
    expect(finalConfidence(92, 1)).toBe(92);
  });

  it("la réduit de 20 % pour un rapprochement juste acceptable (0,6)", () => {
    expect(finalConfidence(90, 0.6)).toBe(72);
  });

  it("borne les entrées hors limites", () => {
    expect(finalConfidence(150, 2)).toBe(100);
    expect(finalConfidence(-10, 0.5)).toBe(0);
  });
});

describe("decide", () => {
  it.each([
    [100, "show"],
    [80, "show"],
    [79, "show_with_alternatives"],
    [50, "show_with_alternatives"],
    [49, "ask_another_clip"],
    [0, "ask_another_clip"],
  ])("confiance %s → %s", (confidence, decision) => {
    expect(decide(confidence)).toBe(decision);
  });
});

describe("scoreIdentification", () => {
  it("affiche un résultat sûr (≥ 80)", () => {
    const score = scoreIdentification([candidate(95, matched(603, 1))]);
    expect(score).toMatchObject({ decision: "show", main: { tmdbId: 603, confidence: 95 }, alternatives: [] });
  });

  it("affiche avec alternatives entre 50 et 79", () => {
    const score = scoreIdentification([candidate(70, matched(1, 1)), candidate(40, matched(2, 1))]);
    expect(score).toMatchObject({
      decision: "show_with_alternatives",
      main: { tmdbId: 1, confidence: 70 },
      alternatives: [{ tmdbId: 2, confidence: 40 }],
    });
  });

  it("demande un autre clip sous 50, en proposant les pistes sans résultat principal", () => {
    const score = scoreIdentification([candidate(45, matched(1, 1)), candidate(20, matched(2, 1))]);
    expect(score).toEqual({
      decision: "ask_another_clip",
      main: null,
      alternatives: [expect.objectContaining({ tmdbId: 1, confidence: 45 }), expect.objectContaining({ tmdbId: 2, confidence: 20 })],
    });
  });

  it("demande un autre clip quand rien n'est retrouvé dans TMDB, même avec une IA très sûre", () => {
    expect(scoreIdentification([candidate(97, NONE)])).toEqual({ decision: "ask_another_clip", main: null, alternatives: [] });
  });

  it("demande un autre clip quand l'IA ne reconnaît rien (aucun candidat)", () => {
    expect(scoreIdentification([])).toEqual({ decision: "ask_another_clip", main: null, alternatives: [] });
  });

  it("fait passer devant une alternative mieux rapprochée que la réponse principale", () => {
    // Réponse principale : 70 × (0,5 + 0,5 × 0,6) = 56 ; alternative : 65 × 1 = 65.
    const score = scoreIdentification([candidate(70, matched(1, 0.6)), candidate(65, matched(2, 1))]);
    expect(score.main?.tmdbId).toBe(2);
    expect(score.alternatives.map((title) => title.tmdbId)).toEqual([1]);
  });

  it("fusionne deux candidats qui désignent la même fiche, en gardant la meilleure confiance", () => {
    const score = scoreIdentification([candidate(60, matched(129, 1)), candidate(85, matched(129, 1))]);
    expect(score).toMatchObject({ decision: "show", main: { tmdbId: 129, confidence: 85 }, alternatives: [] });
  });

  it("distingue un film et une série de même identifiant TMDB", () => {
    const score = scoreIdentification([
      candidate(90, matched(7, 1, { mediaType: "movie" })),
      candidate(60, matched(7, 1, { mediaType: "tv" })),
    ]);
    expect(score.alternatives).toHaveLength(1);
  });

  it("limite les alternatives à 3", () => {
    const candidates = [95, 40, 35, 30, 25].map((confidence, index) => candidate(confidence, matched(index + 1, 1)));
    expect(scoreIdentification(candidates).alternatives).toHaveLength(3);
  });
});
