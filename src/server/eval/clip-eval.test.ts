import { describe, expect, it } from "vitest";

import type { IdentifyResponse } from "@/schemas/identify";

import { type CaseResult, evalManifestSchema, formatReport, judgeResponse, summarize } from "./clip-eval";

const QUOTA = { limit: 1000, remaining: 999, resetAt: "2026-10-23T22:00:00.000Z" };
const title = (tmdbId: number, confidence = 80) => ({
  tmdbId,
  mediaType: "movie" as const,
  title: `Film ${tmdbId}`,
  year: 2000,
  posterPath: null,
  confidence,
});
const EXPECTED = { mediaType: "movie", tmdbId: 603 };

function response(
  decision: IdentifyResponse["decision"],
  main: number | null,
  alternatives: number[] = [],
): IdentifyResponse {
  return {
    decision,
    source: "ai",
    main: main === null ? null : title(main),
    alternatives: alternatives.map((id) => title(id, 40)),
    quota: QUOTA,
    identificationId: null,
  };
}

describe("judgeResponse", () => {
  it("bon titre en premier, en alternative, mauvais titre affiché, abstention", () => {
    expect(judgeResponse(response("show", 603), EXPECTED)).toBe("correct");
    expect(judgeResponse(response("show_with_alternatives", 604, [603]), EXPECTED)).toBe("alternative");
    expect(judgeResponse(response("show", 604), EXPECTED)).toBe("wrong");
    expect(judgeResponse(response("ask_another_clip", null), EXPECTED)).toBe("abstained");
    // « Autre extrait » mais le bon titre figure parmi les pistes proposées.
    expect(judgeResponse(response("ask_another_clip", null, [12, 603]), EXPECTED)).toBe("alternative");
  });

  it("même identifiant mais film au lieu de série : faux", () => {
    expect(judgeResponse(response("show", 603), { mediaType: "tv", tmdbId: 603 })).toBe("wrong");
  });
});

describe("evalManifestSchema", () => {
  it("difficulté moyenne par défaut ; manifeste vide refusé", () => {
    const parsed = evalManifestSchema.parse({ clips: [{ file: "matrix.mp4", tmdbId: 603, mediaType: "movie" }] });
    expect(parsed.clips[0]?.difficulty).toBe("moyen");
    expect(evalManifestSchema.safeParse({ clips: [] }).success).toBe(false);
  });
});

describe("summarize", () => {
  const base = { latencyMs: 1000, costMicroEur: 2000, framesSent: 4, confidence: 80, shown: "movie-603" };
  const clip = (difficulty: "facile" | "moyen" | "difficile") => ({
    file: `${difficulty}.mp4`,
    tmdbId: 603,
    mediaType: "movie" as const,
    difficulty,
  });
  const results: CaseResult[] = [
    { ...base, clip: clip("facile"), verdict: "correct" },
    { ...base, clip: clip("facile"), verdict: "correct", latencyMs: 3000 },
    { ...base, clip: clip("moyen"), verdict: "alternative" },
    { ...base, clip: clip("difficile"), verdict: "wrong", shown: "movie-1" },
    { ...base, clip: clip("difficile"), verdict: "abstained", shown: null, latencyMs: 9000 },
  ];

  it("taux, latences et coût moyen", () => {
    const summary = summarize(results);
    expect(summary).toMatchObject({
      total: 5,
      top1: 0.4,
      visible: 0.6,
      wrongShown: 0.2,
      abstained: 0.2,
      errors: 0,
      latencyMedianMs: 1000,
      latencyP95Ms: 9000,
    });
    expect(summary.costMeanEur).toBeCloseTo(0.002);
    expect(summary.byDifficulty).toEqual({
      facile: { total: 2, top1: 1 },
      moyen: { total: 1, top1: 0 },
      difficile: { total: 2, top1: 0 },
    });
  });

  it("rapport : chiffres clés et liste des échecs seulement", () => {
    const report = formatReport(summarize(results), results, "images.v1");
    expect(report).toContain("Bon titre en premier : 40 %");
    expect(report).toContain("Mauvais titre affiché : 20 %");
    expect(report).toContain("wrong       difficile.mp4 (attendu movie-603, affiché movie-1, 80 %)");
    expect(report).not.toContain("facile.mp4");
  });

  it("aucun résultat : zéros, pas de division par zéro", () => {
    expect(summarize([])).toMatchObject({ total: 0, top1: 0, costMeanEur: 0, latencyP95Ms: 0 });
  });
});
