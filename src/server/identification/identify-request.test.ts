import { describe, expect, it, vi } from "vitest";

import { handleDescribeRequest, handleIdentifyRequest, handleLinkRequest } from "./identify-request";

vi.mock("@/server/http/rate-limit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/server/http/rate-limit")>()),
  checkIdentifyRateLimit: async () => ({ ok: true }),
}));
// Aucun fournisseur IA réel : une requête valide s'arrête à « IA non configurée » (aucun appel payant).
vi.mock("@/server/ai/vision", () => ({ getGuardedVisionProviderOrNull: () => null }));

const ORIGIN = { origin: "https://site.example", host: "site.example" };

// Protection CSRF de POST /api/identify : refus avant toute autre étape (limitation, images, quota, IA).
// Code FORBIDDEN, distinct d'ACCOUNT_SUSPENDED (compte suspendu), pour que le message affiché soit juste.
describe("handleIdentifyRequest — origine", () => {
  it.each([
    ["autre site", { origin: "https://evil.example", host: "site.example" }],
    ["origine absente", { host: "site.example" }],
  ])("%s : 403 FORBIDDEN", async (_label, headers) => {
    const response = await handleIdentifyRequest(new Request("https://site.example/api/identify", { method: "POST", headers }));
    expect(response.status).toBe(403);
    expect((await response.json()).error.code).toBe("FORBIDDEN");
  });
});

describe("handleLinkRequest (U36)", () => {
  // Sources simulées : un test qui les appellerait signalerait une requête sortante imprévue.
  const sources = {
    resolveShort: vi.fn(async () => null),
    metadata: vi.fn(async () => ({ ok: false as const, failure: "unavailable" as const })),
    thumbnail: vi.fn(async () => null),
  };
  function linkRequest(body: unknown, headers: Record<string, string> = ORIGIN) {
    return new Request("https://site.example/api/identify/link", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("autre origine : 403", async () => {
    expect((await handleLinkRequest(linkRequest({ url: "https://youtu.be/dQw4w9WgXcQ" }, { origin: "https://evil.example", host: "site.example" }), sources)).status).toBe(403);
  });

  it.each([
    ["Instagram", "https://www.instagram.com/reel/Cabc123/", "instagram"],
    ["autre site", "https://vimeo.com/1", "unsupported"],
    ["adresse interne", "https://169.254.169.254/latest/meta-data/", "unsupported"],
    ["javascript:", "javascript:alert(1)", "invalid"],
  ])("%s : 400 LINK_UNSUPPORTED (%s), aucune requête sortante", async (_label, url, reason) => {
    const response = await handleLinkRequest(linkRequest({ url }), sources);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatchObject({ code: "LINK_UNSUPPORTED", details: { reason } });
    expect(sources.metadata).not.toHaveBeenCalled();
    expect(sources.resolveShort).not.toHaveBeenCalled();
  });

  it.each([
    ["champ absent", {}],
    ["JSON invalide", "{pas du json"],
  ])("%s : 400 VALIDATION_ERROR", async (_label, body) => {
    expect((await handleLinkRequest(linkRequest(body), sources)).status).toBe(400);
  });
});

describe("handleDescribeRequest (U35)", () => {
  function describeRequest(body: unknown, headers: Record<string, string> = ORIGIN) {
    return new Request("https://site.example/api/identify/description", {
      method: "POST",
      headers: { ...headers, "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("autre origine : 403, avant toute lecture", async () => {
    const response = await handleDescribeRequest(describeRequest({ text: "un homme revit la même journée" }, { origin: "https://evil.example", host: "site.example" }));
    expect(response.status).toBe(403);
  });

  it.each([
    ["moins de 10 caractères", { text: "court" }],
    ["10 caractères seulement avec des espaces autour", { text: "   abc   " }],
    ["plus de 500 caractères", { text: "a".repeat(501) }],
    ["champ absent", {}],
    ["JSON invalide", "{pas du json"],
  ])("%s : 400 VALIDATION_ERROR", async (_label, body) => {
    const response = await handleDescribeRequest(describeRequest(body));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("VALIDATION_ERROR");
  });

  it("description valide sans IA configurée : erreur propre, jamais le texte dans les journaux", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const text = "Un homme revit sans cesse la même journée enneigée";
    const response = await handleDescribeRequest(describeRequest({ text }));
    expect(response.status).toBe(502);
    expect(JSON.stringify(error.mock.calls)).not.toContain("enneigée");
    error.mockRestore();
  });
});
