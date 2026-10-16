import { describe, expect, it } from "vitest";

import { type ModelAnswer, normalizeAnswer } from "./vision-provider";

const BASE: ModelAnswer = {
  recognized: true,
  title: " Le Voyage de Chihiro ",
  originalTitle: "千と千尋の神隠し",
  year: 2001,
  kind: "anime",
  season: null,
  episode: null,
  confidence: 87.4,
  alternatives: [],
};

describe("normalizeAnswer", () => {
  it("nettoie le titre et arrondit la confiance", () => {
    expect(normalizeAnswer(BASE)).toMatchObject({ recognized: true, title: "Le Voyage de Chihiro", confidence: 87 });
  });

  it.each([-5, 150, Number.NaN])("borne une confiance hors limites (%s)", (confidence) => {
    const answer = normalizeAnswer({ ...BASE, confidence });
    expect(answer.confidence).toBeGreaterThanOrEqual(0);
    expect(answer.confidence).toBeLessThanOrEqual(100);
  });

  it("garde 3 alternatives au plus et retire les titres vides", () => {
    const alternative = { title: "Princesse Mononoké", originalTitle: null, year: 1997, kind: "anime" as const, confidence: 10 };
    const answer = normalizeAnswer({ ...BASE, alternatives: [alternative, { ...alternative, title: " " }, alternative, alternative, alternative] });
    expect(answer.alternatives).toHaveLength(3);
  });

  it("traite comme non reconnue une réponse sans titre, même marquée reconnue", () => {
    expect(normalizeAnswer({ ...BASE, title: "  " })).toEqual({ recognized: false, confidence: 0, alternatives: [] });
  });

  it("ignore la confiance annoncée quand le modèle ne reconnaît pas l'œuvre", () => {
    expect(normalizeAnswer({ ...BASE, recognized: false, confidence: 40 })).toMatchObject({ recognized: false, confidence: 0 });
  });
});
