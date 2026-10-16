import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WatchProvider } from "./watch-provider";
import { handleWatchRequest } from "./watch-request";

const OFFERS = {
  FR: { link: "https://www.themoviedb.org/movie/603/watch?locale=FR", flatrate: [{ provider_id: 1, provider_name: "Service FR" }] },
  BE: { link: "https://www.themoviedb.org/movie/603/watch?locale=BE", rent: [{ provider_id: 2, provider_name: "Location BE" }] },
  CH: { link: "https://www.themoviedb.org/movie/603/watch?locale=CH", buy: [{ provider_id: 3, provider_name: "Achat CH" }] },
};

const provider = (): WatchProvider => ({ getOffersByCountry: vi.fn(async () => OFFERS) });

function request(query = "", country?: string): Request {
  return new Request(`https://site.example/api/titles/movie/603/watch${query}`, {
    headers: country ? { "x-vercel-ip-country": country } : undefined,
  });
}

describe("handleWatchRequest", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["FR", "Service FR", "flatrate"],
    ["BE", "Location BE", "rent"],
    ["CH", "Achat CH", "buy"],
  ] as const)("affiche les offres du pays de l'en-tête Vercel (%s)", async (country, name, type) => {
    const response = await handleWatchRequest(request("", country), { mediaType: "movie", id: "603" }, provider);
    const body = await response.json();
    expect(body.data.country).toBe(country);
    expect(body.data.offers[type][0].name).toBe(name);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("prend la France par défaut et respecte le pays choisi par l'utilisateur", async () => {
    const byDefault = await (await handleWatchRequest(request(), { mediaType: "movie", id: "603" }, provider)).json();
    expect(byDefault.data.country).toBe("FR");
    const chosen = await (await handleWatchRequest(request("?country=ch", "FR"), { mediaType: "movie", id: "603" }, provider)).json();
    expect(chosen.data.country).toBe("CH");
  });

  it("pays sans données : réponse vide mais valide (message côté interface)", async () => {
    const body = await (await handleWatchRequest(request("", "TG"), { mediaType: "movie", id: "603" }, provider)).json();
    expect(body.data).toMatchObject({ country: "TG", link: null, countries: ["BE", "CH", "FR"] });
  });

  it.each([
    { mediaType: "anime", id: "603" },
    { mediaType: "movie", id: "abc" },
    { mediaType: "movie", id: "-1" },
  ])("refuse des paramètres invalides %o", async (params) => {
    expect((await handleWatchRequest(request(), params, provider)).status).toBe(400);
  });

  it("TMDB indisponible : UPSTREAM_ERROR", async () => {
    const failing = (): WatchProvider => ({
      getOffersByCountry: async () => {
        throw new Error("panne");
      },
    });
    expect((await handleWatchRequest(request(), { mediaType: "tv", id: "1396" }, failing)).status).toBe(502);
  });
});
