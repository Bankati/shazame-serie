import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Account } from "@/server/auth/guards";
import { createMemoryLimiter } from "@/server/http/attempt-limiter";

import { handleReportImages, handleReportPost, type ReportDeps } from "./report-request";
import type { ReportImageStore } from "./reports";

const ID = "6f1c2a3b-0000-4000-8000-0000000000aa";
const IDENTIFICATION = { id: ID, fingerprint: "empreinte", tmdbId: 603, mediaType: "movie" as const };
const ACCOUNT: Account = { id: "8b1f3c1e-0000-4000-8000-000000000001", email: "a@example.com", displayName: null, role: "user", status: "active" };
const ORIGIN = { origin: "https://site.example", host: "site.example" };

let frame: Blob;

function deps(overrides: Partial<ReportDeps> = {}) {
  const store: ReportImageStore = { upload: vi.fn(async () => {}), signedUrl: vi.fn(async (path: string) => `https://stockage.example/${path}`) };
  const all = {
    limiter: createMemoryLimiter(10, 3_600_000),
    account: vi.fn(async () => null as Account | null),
    visitorKey: vi.fn(async () => "visiteur-1" as string | null),
    findIdentification: vi.fn(async () => IDENTIFICATION as typeof IDENTIFICATION | null),
    create: vi.fn(async () => ({ reportId: "rapport-1", created: true })),
    store: () => store,
    attachImages: vi.fn(async () => {}),
    ...overrides,
  };
  return { deps: all as ReportDeps, all, store };
}

function report(fields: Record<string, string>, frames = 0, headers: Record<string, string> = ORIGIN): Request {
  const body = new FormData();
  for (const [key, value] of Object.entries(fields)) body.set(key, value);
  for (let index = 0; index < frames; index++) body.append("frames", frame, `image-${index + 1}.jpg`);
  return new Request("https://site.example/api/reports", { method: "POST", headers, body });
}

beforeEach(async () => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  const jpeg = await sharp({ create: { width: 64, height: 36, channels: 3, background: "#884422" } }).jpeg().toBuffer();
  frame = new Blob([new Uint8Array(jpeg)], { type: "image/jpeg" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/reports", () => {
  it("sans consentement : signalement enregistré, aucune image stockée (critère de fin U20)", async () => {
    const { deps: d, all, store } = deps();
    const response = await handleReportPost(report({ identificationId: ID, correctedTmdbId: "604", correctedMediaType: "movie" }), d);
    expect(response.status).toBe(201);
    expect(all.create).toHaveBeenCalledWith({ identification: IDENTIFICATION, userId: null, corrected: { tmdbId: 604, mediaType: "movie" }, imagesConsent: false });
    expect(store.upload).not.toHaveBeenCalled();
    expect((await response.json()).data).toEqual({ reportId: "rapport-1", imagesStored: 0 });
  });

  it("des images envoyées sans consentement sont refusées, rien n'est créé", async () => {
    const { deps: d, all } = deps();
    expect((await handleReportPost(report({ identificationId: ID, imagesConsent: "false" }, 3), d)).status).toBe(400);
    expect(all.create).not.toHaveBeenCalled();
  });

  it("avec consentement : images rangées sous le dossier du signalement", async () => {
    const { deps: d, all, store } = deps({ account: vi.fn(async () => ACCOUNT) });
    const response = await handleReportPost(report({ identificationId: ID, imagesConsent: "true" }, 3), d);
    expect((await response.json()).data.imagesStored).toBe(3);
    expect(store.upload).toHaveBeenCalledTimes(3);
    expect(all.attachImages).toHaveBeenCalledWith("rapport-1", ["rapport-1/1.jpg", "rapport-1/2.jpg", "rapport-1/3.jpg"]);
    expect(all.findIdentification).toHaveBeenCalledWith(ID, { userId: ACCOUNT.id });
  });

  it("identification d'une autre personne, ou visiteur sans cookie : 404", async () => {
    expect((await handleReportPost(report({ identificationId: ID }), deps({ findIdentification: vi.fn(async () => null) }).deps)).status).toBe(404);
    expect((await handleReportPost(report({ identificationId: ID }), deps({ visitorKey: vi.fn(async () => null) }).deps)).status).toBe(404);
  });

  it("deuxième signalement de la même identification : 200, sans nouvelles images", async () => {
    const { deps: d, store } = deps({ create: vi.fn(async () => ({ reportId: "rapport-1", created: false })) });
    const response = await handleReportPost(report({ identificationId: ID, imagesConsent: "true" }, 2), d);
    expect(response.status).toBe(200);
    expect(store.upload).not.toHaveBeenCalled();
  });

  it.each([
    ["autre origine", report({ identificationId: ID }, 0, { origin: "https://evil.example", host: "site.example" }), 403],
    ["identifiant invalide", report({ identificationId: "pas-un-uuid" }), 400],
    ["correction incomplète", report({ identificationId: ID, correctedTmdbId: "604" }), 400],
  ])("%s : refusé", async (_label, request, status) => {
    const { deps: d, all } = deps();
    expect((await handleReportPost(request, d)).status).toBe(status);
    expect(all.create).not.toHaveBeenCalled();
  });

  it("11e signalement en une heure depuis la même adresse : refusé", async () => {
    const { deps: d } = deps();
    for (let index = 0; index < 10; index++) await handleReportPost(report({ identificationId: ID }), d);
    expect((await handleReportPost(report({ identificationId: ID }), d)).status).toBe(429);
  });
});

describe("GET /api/admin/reports/{id}/images", () => {
  const store: ReportImageStore = { upload: vi.fn(), signedUrl: async (path) => `https://stockage.example/${path}?jeton` };

  it("réservé à l'administration", async () => {
    const paths = vi.fn(async () => ["r/1.jpg"]);
    const denied = await handleReportImages(ID, { access: async () => ({ ok: false, code: "FORBIDDEN" }), paths, store: () => store });
    expect(denied.status).toBe(403);
    expect(paths).not.toHaveBeenCalled();
  });

  it("administrateur : liens signés des images", async () => {
    const response = await handleReportImages(ID, {
      access: async () => ({ ok: true, account: { ...ACCOUNT, role: "admin" } }),
      paths: async () => ["r/1.jpg", "r/2.jpg"],
      store: () => store,
    });
    expect((await response.json()).data.images).toEqual(["https://stockage.example/r/1.jpg?jeton", "https://stockage.example/r/2.jpg?jeton"]);
  });
});
