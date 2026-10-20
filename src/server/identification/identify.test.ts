import { describe, expect, it, vi } from "vitest";

import { type VisionAnswer, VisionError, type VisionProvider, type VisionResult } from "@/server/ai/vision-provider";
import type { CatalogCandidate, CatalogProvider, CatalogTitleDetails } from "@/server/catalog/catalog-provider";
import { createQuotaService, type QuotaIdentity } from "@/server/quota/quota";
import { createMemoryQuotaStore } from "@/server/quota/quota-store";

import { descriptionFingerprint, type IdentifyDeps, identifyClip, identifyDescription } from "./identify";
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

function setup(
  options: { vision?: VisionProvider["identify"]; text?: VisionProvider["identifyFromText"]; cached?: CachedResult | null } = {},
) {
  // Même horloge pour le service et le stockage (sinon les compteurs paraîtraient expirés).
  const now = new Date("2026-07-14T10:00:00Z");
  const quota = createQuotaService({ store: createMemoryQuotaStore(() => now.getTime()), limits: async () => LIMITS, now: () => now });
  const records: IdentificationRecord[] = [];
  const store = vi.fn(async () => {});
  const recordHit = vi.fn(async () => {});
  const identify = vi.fn(options.vision ?? (async () => visionResult(SURE)));
  const identifyFromText = vi.fn(options.text ?? (async () => ({ ...visionResult(SURE), promptVersion: "describe.v1" })));
  const catalog: CatalogProvider = {
    searchTitles: async () => [MATRIX],
    getTitleDetails: async () => DETAILS,
    getImageConfig: async () => ({ secureBaseUrl: "https://image.tmdb.org/t/p/", posterSizes: [], backdropSizes: [] }),
    getTitlePage: async () => null,
    getTrending: async () => [],
    getTopRatedMovies: async () => [],
    getGenres: async () => [],
  };
  const deps: IdentifyDeps = {
    quota,
    vision: { identify, identifyFromText },
    catalog,
    prepareLookup: async () => ({ frameHashes: [1n, 2n], fingerprint: "empreinte" }),
    cache: { find: async () => options.cached ?? null, recordHit, store },
    persist: async (record) => {
      records.push(record);
      return `00000000-0000-4000-8000-${String(records.length).padStart(12, "0")}`;
    },
  };
  return { deps, quota, records, identify, identifyFromText, store, recordHit };
}

describe("identifyDescription (U35)", () => {
  const TEXT = "Un homme revit sans cesse la même journée dans une petite ville enneigée";

  it("résultat sûr : décompté, enregistré avec l'empreinte du texte (jamais le texte), sans cache", async () => {
    const { deps, quota, records, identifyFromText, store } = setup();

    const outcome = await identifyDescription(deps, { identity: VISITOR, text: TEXT });

    expect(outcome).toMatchObject({ ok: true, response: { decision: "show", source: "ai", main: { title: "Matrix" } } });
    expect(identifyFromText).toHaveBeenCalledWith(TEXT);
    expect((await quota.status(VISITOR)).used).toBe(1);
    expect(records[0]).toMatchObject({ inputKind: "description", counted: true, promptVersion: "describe.v1" });
    expect(records[0]!.fingerprint).toMatch(/^description:[0-9a-f]{64}$/);
    expect(JSON.stringify(records)).not.toContain("journée");
    expect(store).not.toHaveBeenCalled();
  });

  it("sous 50 % : rien de décompté (RG3) ; échec IA : rien de décompté (RG16)", async () => {
    const unsure = setup({ text: async () => visionResult(UNSURE) });
    expect(await identifyDescription(unsure.deps, { identity: VISITOR, text: TEXT })).toMatchObject({ ok: true, response: { main: null } });
    expect((await unsure.quota.status(VISITOR)).used).toBe(0);

    const failing = setup({
      text: async () => {
        throw new VisionError("unavailable", 200);
      },
    });
    expect(await identifyDescription(failing.deps, { identity: VISITOR, text: TEXT })).toEqual({ ok: false, code: "UPSTREAM_ERROR" });
    expect((await failing.quota.status(VISITOR)).used).toBe(0);
    expect(failing.records[0]).toMatchObject({ inputKind: "description", outcome: "failed", counted: false });
  });

  it("quota épuisé : refus avant tout appel IA", async () => {
    const { deps, quota, identifyFromText } = setup();
    for (let index = 0; index < LIMITS.visitorDaily; index++) {
      await identifyDescription(deps, { identity: VISITOR, text: `${TEXT} ${index}` });
    }
    identifyFromText.mockClear();
    expect(await identifyDescription(deps, { identity: VISITOR, text: TEXT })).toMatchObject({ ok: false, code: "QUOTA_EXCEEDED" });
    expect(identifyFromText).not.toHaveBeenCalled();
    expect((await quota.status(VISITOR)).used).toBe(LIMITS.visitorDaily);
  });

  it("plafond de dépense atteint : AI_PAUSED, rien de décompté", async () => {
    const { deps, quota } = setup({
      text: async () => {
        throw new VisionError("paused");
      },
    });
    expect(await identifyDescription(deps, { identity: VISITOR, text: TEXT })).toEqual({ ok: false, code: "AI_PAUSED" });
    expect((await quota.status(VISITOR)).used).toBe(0);
  });

  it("empreinte : même description à la casse, aux accents et aux espaces près", () => {
    expect(descriptionFingerprint("Un  homme  REVIT la même journée")).toBe(descriptionFingerprint("un homme revit la meme journee"));
    expect(descriptionFingerprint("un homme revit")).not.toBe(descriptionFingerprint("une femme revit"));
  });
});

describe("identifyClip", () => {
  it("affiche un résultat sûr, le décompte et le met en cache", async () => {
    const { deps, quota, records, store } = setup();

    const outcome = await identifyClip(deps, { identity: VISITOR, images: IMAGES });

    expect(outcome).toMatchObject({
      ok: true,
      response: {
        decision: "show",
        source: "ai",
        main: { tmdbId: 603, title: "Matrix", confidence: 95 },
        quota: { limit: 3, remaining: 2 },
        // U20 : la réponse porte l'identifiant enregistré, pour un éventuel signalement.
        identificationId: "00000000-0000-4000-8000-000000000001",
      },
    });
    expect((await quota.status(VISITOR)).used).toBe(1);
    expect(records).toEqual([expect.objectContaining({ source: "ai", outcome: "shown", counted: true, costMicroEur: 1800, model: "gpt-6.1-sol" })]);
    expect(store).toHaveBeenCalledWith(expect.objectContaining({ fingerprint: "empreinte" }), expect.objectContaining({ tmdbId: 603, confidence: 95 }));
  });

  it("mode image (U34) : une seule capture, même circuit, consigne et mode transmis, mode enregistré", async () => {
    const { deps, quota, records, identify } = setup();

    const outcome = await identifyClip(deps, { identity: VISITOR, images: [IMAGES[0]!], mode: "images" });

    expect(outcome).toMatchObject({ ok: true, response: { decision: "show", source: "ai" } });
    expect(identify).toHaveBeenCalledWith([IMAGES[0]], { mode: "images" });
    expect((await quota.status(VISITOR)).used).toBe(1);
    expect(records[0]).toMatchObject({ inputKind: "images", counted: true });
  });

  it("mode image : la même capture renvoyée sert le cache, sans décompte ni appel IA (critère de fin U34)", async () => {
    const cached: CachedResult = { cacheId: "c2", tmdbId: 603, mediaType: "movie", confidence: 91, alternatives: [], validated: false };
    const { deps, quota, records, identify } = setup({ cached });

    const outcome = await identifyClip(deps, { identity: VISITOR, images: [IMAGES[0]!], mode: "images" });

    expect(outcome).toMatchObject({ ok: true, response: { source: "cache", main: { title: "Matrix" } } });
    expect(identify).not.toHaveBeenCalled();
    expect((await quota.status(VISITOR)).used).toBe(0);
    expect(records[0]).toMatchObject({ inputKind: "images", source: "cache", counted: false });
  });

  it("sans mode : clip (compatibilité avant U34)", async () => {
    const { deps, records, identify } = setup();
    await identifyClip(deps, { identity: VISITOR, images: IMAGES });
    expect(identify).toHaveBeenCalledWith(IMAGES, { mode: "clip" });
    expect(records[0]).toMatchObject({ inputKind: "clip" });
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
