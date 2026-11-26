import { describe, expect, it } from "vitest";

import { type CacheState, decideCacheCorrection, decideReview, type ReviewTarget } from "./report-review-rules";

const target = (fields: Partial<ReviewTarget> = {}): ReviewTarget => ({
  status: "open",
  proposed: { tmdbId: 603, mediaType: "movie" },
  hasImages: false,
  ...fields,
});

const cache = (fields: Partial<CacheState> = {}): CacheState => ({
  tmdbId: 603,
  mediaType: "movie",
  confidence: 91,
  disabled: true,
  validated: false,
  ...fields,
});

describe("decideReview", () => {
  it("rejette le signalement quand le titre retenu est le titre proposé", () => {
    expect(decideReview(target(), { tmdbId: 603, mediaType: "movie" }, false)).toEqual({
      kind: "review",
      status: "rejected",
      retained: { tmdbId: 603, mediaType: "movie" },
    });
  });

  it("marque revu quand le titre retenu corrige la proposition", () => {
    expect(decideReview(target(), { tmdbId: 604, mediaType: "movie" }, false)).toMatchObject({ status: "reviewed" });
  });

  it("distingue un même identifiant d'un autre type (film / série)", () => {
    expect(decideReview(target(), { tmdbId: 603, mediaType: "tv" }, false)).toMatchObject({ status: "reviewed" });
  });

  it("corrige une identification sans proposition (revu)", () => {
    expect(decideReview(target({ proposed: null }), { tmdbId: 1, mediaType: "tv" }, false)).toMatchObject({ status: "reviewed" });
  });

  it("ajoute au jeu de test seulement avec des images", () => {
    expect(decideReview(target(), { tmdbId: 603, mediaType: "movie" }, true)).toEqual({ kind: "refused", reason: "eval_needs_images" });
    expect(decideReview(target({ hasImages: true }), { tmdbId: 603, mediaType: "movie" }, true)).toMatchObject({ status: "added_to_eval" });
  });

  it("refuse un signalement absent ou déjà revu", () => {
    expect(decideReview(null, { tmdbId: 1, mediaType: "movie" }, false)).toEqual({ kind: "refused", reason: "not_found" });
    for (const status of ["reviewed", "added_to_eval", "rejected"] as const) {
      expect(decideReview(target({ status }), { tmdbId: 1, mediaType: "movie" }, false)).toEqual({ kind: "refused", reason: "already_reviewed" });
    }
  });
});

describe("decideCacheCorrection", () => {
  it("réactive et valide l'entrée sans toucher à la confiance si le titre ne change pas", () => {
    expect(decideCacheCorrection(cache(), { tmdbId: 603, mediaType: "movie" })).toEqual({
      tmdbId: 603,
      mediaType: "movie",
      confidence: 91,
      validated: true,
      disabled: false,
      clearAlternatives: false,
    });
  });

  it("remplace le titre, vide les alternatives et passe la confiance à 100", () => {
    expect(decideCacheCorrection(cache(), { tmdbId: 604, mediaType: "movie" })).toMatchObject({
      tmdbId: 604,
      confidence: 100,
      clearAlternatives: true,
    });
  });

  it("ne change rien à une entrée déjà validée, active et juste", () => {
    expect(decideCacheCorrection(cache({ disabled: false, validated: true }), { tmdbId: 603, mediaType: "movie" })).toBeNull();
  });
});
