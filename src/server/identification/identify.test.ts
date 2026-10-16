import { describe, expect, it, vi } from "vitest";

import { type VisionAnswer, VisionError, type VisionProvider, type VisionResult } from "@/server/ai/vision-provider";
import type { CatalogCandidate, CatalogProvider, CatalogTitleDetails } from "@/server/catalog/catalog-provider";
import { createQuotaService, type QuotaIdentity } from "@/server/quota/quota";
import { createMemoryQuotaStore } from "@/server/quota/quota-store";

import { type IdentifyDeps, identifyClip } from "./identify";
import type { IdentificationRecord } from "./persist";
import type { CachedResult } from "./result-cache";

// Orchestrateur testé avec des dépendances simulées : chaque chemin du flux et chaque règle de décompte.
const VISITOR: QuotaIdentity = { kind: "visitor", id: "v1" };
const IMAGES = [Buffer.from("a"), Buffer.from("b")];
const LIMITS = { visitorDaily: 3, freeDaily: 15, premiumDailyCap: 100 };

const MATRIX: CatalogCandidate = { tmdbId: 603, mediaType: "movie", title: "Matrix", originalTitle: "The Matrix", year: 1999, posterPath: "/m.jpg", popularity: 80 };
const DETAILS: CatalogTitleDetails = { ...MATRIX, overview: "", genres: [], runtimeMinutes: 136, backdropPath: null, voteAverage: 8.2 };

function visionResult(answer: VisionAnswer): VisionResult {
  return { answer, provider: "openai", model: "gpt-6.1-sol", promptVersion: "identify.v1", attempts: 1, latencyMs: 2000, usage: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1 }, costMicroEur: 1800 };
}

const SURE: VisionAnswer = { recognized: true, title: "Matrix", originalTitle: "The Matrix", year: 1999, kind: "film", season: null, episode: null, confidence: 95, alternatives: [] };
const UNSURE: VisionAnswer = { ...SURE, confidence: 40 };

function setup(options: { vision?: VisionProvider["identify"]; cached?: CachedResult | null } = {}) {
  // Même horloge pour le service et le stockage (sinon les compteurs paraîtraient expirés).
  const now = new Date("2026-07-14T10:00:00Z");
  const quota = createQuotaService({ store: createMemoryQuotaStore(() => now.getTime()), limits: async () => LIMITS, now: () => now });
  const records: IdentificationRecord[] = [];
  const store = vi.fn(async () => {});
  const recordHit = vi.fn(async () => {});
  const identify = vi.fn(options.vision ?? (async () => visionResult(SURE)));
  const catalog: CatalogProvider = {
    searchTitles: async () => [MATRIX],
    getTitleDetails: async () => DETAILS,
    getImageConfig: async () => ({ secureBaseUrl: "https://image.tmdb.org/t/p/", posterSizes: [], backdropSizes: [] }),
    getTitlePage: async () => null,
  };
  const deps: IdentifyDeps = {
    quota,
    vision: { identify },
    catalog,
    prepareLookup: async () => ({ frameHashes: [1n, 2n], fingerprint: "empreinte" }),
    cache: { find: async () => options.cached ?? null, recordHit, store },
    persist: async (record) => {
      records.push(record);
    },
  };
  return { deps, quota, records, identify, store, recordHit };
}

describe("identifyClip", () => {
  it("affiche un résultat sûr, le décompte et le met en cache", async () => {
    const { deps, quota, records, store } = setup();

    const outcome = await identifyClip(deps, { identity: VISITOR, images: IMAGES });

    expect(outcome).toMatchObject({
      ok: true,
      response: { decision: "show", source: "ai", main: { tmdbId: 603, title: "Matrix", confidence: 95 }, quota: { limit: 3, remaining: 2 } },
    });
    expect((await quota.status(VISITOR)).used).toBe(1);
    expect(records).toEqual([expect.objectContaining({ source: "ai", outcome: "shown", counted: true, costMicroEur: 1800, model: "gpt-6.1-sol" })]);
    expect(store).toHaveBeenCalledWith(expect.objectContaining({ fingerprint: "empreinte" }), expect.objectContaining({ tmdbId: 603, confidence: 95 }));
  });

  it("ne décompte pas un résultat sous 50 % (RG3)", async () => {
    const { deps, quota, records, store } = setup({ vision: async () => visionResult(UNSURE) });

    const outcome = await identifyClip(deps, { identity: VISITOR, images: IMAGES });

    expect(outcome).toMatchObject({ ok: true, response: { decision: "ask_another_clip", main: null } });
    expect((await quota.status(VISITOR)).used).toBe(0);
    expect(records[0]).toMatchObject({ outcome: "low_confidence", counted: false });
    expect(store).not.toHaveBeenCalled();
  });

  it("ne décompte pas un échec de l'IA, mais enregistre la dépense déjà facturée (RG16)", async () => {
    const { deps, quota, records } = setup({
      vision: async () => {
        throw new VisionError("unavailable", 900);
      },
    });

    expect(await identifyClip(deps, { identity: VISITOR, images: IMAGES })).toEqual({ ok: false, code: "UPSTREAM_ERROR" });
    expect((await quota.status(VISITOR)).used).toBe(0);
    expect(records[0]).toMatchObject({ outcome: "failed", counted: false });
  });

  it("ne décompte pas un succès du cache et n'appelle pas l'IA (RG6)", async () => {
    const cached: CachedResult = { cacheId: "c1", tmdbId: 603, mediaType: "movie", confidence: 92, alternatives: [], validated: false };
    const { deps, quota, records, identify, recordHit } = setup({ cached });

    const outcome = await identifyClip(deps, { identity: VISITOR, images: IMAGES });

    expect(outcome).toMatchObject({ ok: true, response: { source: "cache", decision: "show", main: { title: "Matrix", confidence: 92 } } });
    expect(identify).not.toHaveBeenCalled();
    expect(recordHit).toHaveBeenCalledWith("c1");
    expect((await quota.status(VISITOR)).used).toBe(0);
    expect(records[0]).toMatchObject({ source: "cache", counted: false, costMicroEur: 0 });
  });

  it("refuse avant tout calcul quand le quota est épuisé, même pour un extrait en cache (AD-13)", async () => {
    const cached: CachedResult = { cacheId: "c1", tmdbId: 603, mediaType: "movie", confidence: 92, alternatives: [], validated: false };
    const { deps, identify } = setup({ cached });
    for (let index = 0; index < 3; index++) {
      const reserved = await deps.quota.reserve(VISITOR);
      if (reserved.ok) reserved.reservation.commit();
    }

    const outcome = await identifyClip(deps, { identity: VISITOR, images: IMAGES });

    expect(outcome).toEqual({ ok: false, code: "QUOTA_EXCEEDED", quota: { limit: 3, remaining: 0, resetAt: "2026-07-14T22:00:00.000Z" } });
    expect(identify).not.toHaveBeenCalled();
  });

  it("deux identifications simultanées pour une seule unité restante : une seule aboutit", async () => {
    const { deps } = setup();
    for (let index = 0; index < 2; index++) {
      const reserved = await deps.quota.reserve(VISITOR);
      if (reserved.ok) reserved.reservation.commit();
    }

    const outcomes = await Promise.all([
      identifyClip(deps, { identity: VISITOR, images: IMAGES }),
      identifyClip(deps, { identity: VISITOR, images: IMAGES }),
    ]);

    expect(outcomes.map((outcome) => (outcome.ok ? "ok" : outcome.code)).sort()).toEqual(["QUOTA_EXCEEDED", "ok"]);
  });

  it("IA en pause (plafond atteint) : AI_PAUSED, rien de décompté, le cache répond encore (RG5)", async () => {
    const paused = async () => {
      throw new VisionError("paused");
    };
    const withoutCache = setup({ vision: paused });
    expect(await identifyClip(withoutCache.deps, { identity: VISITOR, images: IMAGES })).toEqual({ ok: false, code: "AI_PAUSED" });
    expect((await withoutCache.quota.status(VISITOR)).used).toBe(0);

    const cached: CachedResult = { cacheId: "c1", tmdbId: 603, mediaType: "movie", confidence: 92, alternatives: [], validated: false };
    const withCache = setup({ vision: paused, cached });
    const outcome = await identifyClip(withCache.deps, { identity: VISITOR, images: IMAGES });
    expect(outcome).toMatchObject({ ok: true, response: { source: "cache", main: { title: "Matrix" } } });
  });
});
