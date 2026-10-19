import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Account } from "@/server/auth/guards";
import { watchlistLimit } from "@/server/billing/entitlement";

import { handleWatchlistChange, handleWatchlistGet, type WatchlistDeps } from "./watchlist-request";

const ACCOUNT: Account = { id: "8b1f3c1e-0000-4000-8000-000000000001", email: "a@example.com", displayName: null, role: "user", status: "active" };
const ORIGIN = { origin: "https://site.example", host: "site.example", "content-type": "application/json" };
const MATRIX = { tmdbId: 603, mediaType: "movie" };

function deps(overrides: Partial<WatchlistDeps> = {}): WatchlistDeps & { add: ReturnType<typeof vi.fn> } {
  return {
    account: async () => ACCOUNT,
    limitFor: async () => 100,
    list: async () => [{ tmdbId: 603, mediaType: "movie" }],
    add: vi.fn(async () => ({ status: "added" as const, count: 1 })),
    remove: vi.fn(async () => 0),
    ...overrides,
  } as WatchlistDeps & { add: ReturnType<typeof vi.fn> };
}

function change(body: unknown, headers: Record<string, string> = ORIGIN, method = "POST") {
  return new Request("https://site.example/api/watchlist", { method, headers, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/watchlist", () => {
  it("visiteur : 401", async () => {
    expect((await handleWatchlistGet(deps({ account: async () => null }))).status).toBe(401);
  });

  it("compte : titres et limite, jamais en cache ; un compte suspendu garde la lecture", async () => {
    const response = await handleWatchlistGet(deps({ account: async () => ({ ...ACCOUNT, status: "suspended" }) }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect((await response.json()).data).toEqual({ items: [{ tmdbId: 603, mediaType: "movie" }], limit: 100 });
  });
});

describe("POST / DELETE /api/watchlist", () => {
  it("ajoute un titre (201), puis un doublon répond 200 sans rien créer", async () => {
    const d = deps();
    expect((await handleWatchlistChange(change(MATRIX), "add", d)).status).toBe(201);
    expect(d.add).toHaveBeenCalledWith(ACCOUNT.id, MATRIX, 100);
    d.add.mockResolvedValueOnce({ status: "exists", count: 1 });
    expect((await handleWatchlistChange(change(MATRIX), "add", d)).status).toBe(200);
  });

  it("liste pleine : 409 WATCHLIST_FULL avec la limite", async () => {
    const response = await handleWatchlistChange(change(MATRIX), "add", deps({ add: vi.fn(async () => ({ status: "full" as const, count: 100 })) }));
    expect(response.status).toBe(409);
    expect((await response.json()).error).toMatchObject({ code: "WATCHLIST_FULL", details: { limit: 100 } });
  });

  it("Premium (droits simulés) : aucune limite transmise", async () => {
    const d = deps({ limitFor: async () => watchlistLimit("premium") });
    await handleWatchlistChange(change(MATRIX), "add", d);
    expect(d.add).toHaveBeenCalledWith(ACCOUNT.id, MATRIX, null);
  });

  it.each([
    ["autre origine", change(MATRIX, { ...ORIGIN, origin: "https://evil.example" }), 403, "FORBIDDEN"],
    ["corps invalide", change({ tmdbId: -1, mediaType: "anime" }), 400, "VALIDATION_ERROR"],
  ])("%s : refusé avant toute lecture du compte", async (_label, request, status, code) => {
    const account = vi.fn(async () => ACCOUNT);
    const response = await handleWatchlistChange(request, "add", deps({ account }));
    expect(response.status).toBe(status);
    expect((await response.json()).error.code).toBe(code);
    expect(account).not.toHaveBeenCalled();
  });

  it("visiteur : 401 ; compte suspendu : ACCOUNT_SUSPENDED, rien n'est modifié", async () => {
    expect((await handleWatchlistChange(change(MATRIX), "add", deps({ account: async () => null }))).status).toBe(401);
    const d = deps({ account: async () => ({ ...ACCOUNT, status: "suspended" }) });
    const response = await handleWatchlistChange(change(MATRIX, ORIGIN, "DELETE"), "remove", d);
    expect((await response.json()).error.code).toBe("ACCOUNT_SUSPENDED");
    expect(d.remove).not.toHaveBeenCalled();
  });

  it("retrait : nombre de titres restants", async () => {
    const response = await handleWatchlistChange(change(MATRIX, ORIGIN, "DELETE"), "remove", deps({ remove: vi.fn(async () => 4) }));
    expect((await response.json()).data).toEqual({ count: 4, limit: 100 });
  });
});
