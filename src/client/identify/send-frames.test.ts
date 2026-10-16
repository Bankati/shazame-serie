import { afterEach, describe, expect, it, vi } from "vitest";

import { sendFrames } from "./send-frames";

const QUOTA = { limit: 3, remaining: 0, resetAt: "2026-07-14T22:00:00.000Z" };
const RESPONSE = {
  decision: "show",
  source: "ai",
  main: { tmdbId: 603, mediaType: "movie", title: "Matrix", year: 1999, posterPath: null, confidence: 94 },
  alternatives: [],
  quota: { ...QUOTA, remaining: 2 },
};

function mockFetch(body: unknown) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify(body)));
}

describe("sendFrames", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envoie les images dans le champ « frames » et valide la réponse", async () => {
    const fetch = mockFetch({ ok: true, data: RESPONSE });
    const result = await sendFrames([new Blob(["a"], { type: "image/jpeg" }), new Blob(["b"], { type: "image/jpeg" })]);

    expect(result).toEqual({ ok: true, response: RESPONSE });
    const init = fetch.mock.calls[0]?.[1] as RequestInit;
    expect((init.body as FormData).getAll("frames")).toHaveLength(2);
  });

  it("traduit un quota épuisé avec son heure de remise à zéro", async () => {
    mockFetch({ ok: false, error: { code: "QUOTA_EXCEEDED", message: "…", details: { quota: QUOTA } } });
    expect(await sendFrames([])).toEqual({ ok: false, failure: { kind: "quota", quota: QUOTA } });
  });

  it.each([
    ["RATE_LIMITED", "rate_limited"],
    ["FRAMES_UNUSABLE", "frames"],
    ["AI_PAUSED", "paused"],
    ["UPSTREAM_ERROR", "unavailable"],
  ])("traduit %s", async (code, kind) => {
    mockFetch({ ok: false, error: { code, message: "…" } });
    expect(await sendFrames([])).toEqual({ ok: false, failure: { kind } });
  });

  it("refuse une réponse inattendue sans planter", async () => {
    mockFetch({ ok: true, data: { decision: "inconnue" } });
    expect(await sendFrames([])).toEqual({ ok: false, failure: { kind: "unavailable" } });
  });

  it("traite une panne réseau comme une indisponibilité", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("réseau"));
    expect(await sendFrames([])).toEqual({ ok: false, failure: { kind: "unavailable" } });
  });
});
