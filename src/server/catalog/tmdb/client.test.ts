import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { CatalogError } from "../catalog-provider";
import { createTmdbClient } from "./client";

const schema = z.object({ ok: z.boolean() });
const noSleep = async () => {};

function respond(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

describe("createTmdbClient", () => {
  it("envoie le jeton en Bearer et les paramètres, puis valide la réponse", async () => {
    const fetch = vi.fn(async () => respond(200, { ok: true }));
    const get = createTmdbClient({ token: "jeton", fetch, sleep: noSleep });

    await expect(get({ path: "/search/multi", params: { query: "Dune", page: 1 } }, schema)).resolves.toEqual({ ok: true });
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.themoviedb.org/3/search/multi?query=Dune&page=1");
    expect(init.headers).toMatchObject({ Authorization: "Bearer jeton" });
  });

  it("refuse une réponse qui ne respecte pas le schéma", async () => {
    const get = createTmdbClient({ token: "t", fetch: async () => respond(200, { ok: "oui" }), sleep: noSleep });
    await expect(get({ path: "/x" }, schema)).rejects.toMatchObject({ reason: "invalid_response" });
  });

  it("réessaie une fois après un 429 en respectant Retry-After (borné)", async () => {
    const sleep = vi.fn(noSleep);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(respond(429, {}, { "retry-after": "30" }))
      .mockResolvedValueOnce(respond(200, { ok: true }));
    const get = createTmdbClient({ token: "t", fetch, sleep });

    await expect(get({ path: "/x" }, schema)).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(2000);
  });

  it("abandonne après deux pannes réseau", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    const get = createTmdbClient({ token: "t", fetch, sleep: noSleep });

    await expect(get({ path: "/x" }, schema)).rejects.toBeInstanceOf(CatalogError);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("ne réessaie pas un 401 (jeton invalide)", async () => {
    const fetch = vi.fn(async () => respond(401, {}));
    const get = createTmdbClient({ token: "t", fetch, sleep: noSleep });

    await expect(get({ path: "/x" }, schema)).rejects.toMatchObject({ reason: "unavailable" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("distingue une fiche inexistante (404) d'une réponse invalide", async () => {
    const get = createTmdbClient({ token: "t", fetch: async () => respond(404, {}), sleep: noSleep });
    await expect(get({ path: "/movie/0" }, schema)).rejects.toMatchObject({ reason: "not_found" });
  });
});
