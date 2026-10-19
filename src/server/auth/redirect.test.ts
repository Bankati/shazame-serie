import { describe, expect, it } from "vitest";

import { requestOrigin, safeNextPath } from "./redirect";

describe("safeNextPath", () => {
  it.each(["/", "/titre/film/603-matrix", "/#identifier", "/titre/serie/1396?onglet=1"])("garde un chemin interne : %s", (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    undefined,
    "",
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/titre\nSet-Cookie:x",
    "/connexion",
    "/auth/callback?code=x",
    `/${"a".repeat(600)}`,
  ])("refuse %s", (path) => {
    expect(safeNextPath(path)).toBe("/");
  });

  it("utilise le repli fourni", () => {
    expect(safeNextPath("//evil.example", "")).toBe("");
  });
});

describe("requestOrigin", () => {
  const fallback = "https://site.example";

  it("prend l'hôte transmis par Vercel, en https", () => {
    const headers = new Headers({ host: "interne", "x-forwarded-host": "preview-abc.vercel.app", "x-forwarded-proto": "https" });
    expect(requestOrigin(headers, fallback)).toBe("https://preview-abc.vercel.app");
  });

  it("http en local", () => {
    expect(requestOrigin(new Headers({ host: "localhost:3200" }), fallback)).toBe("http://localhost:3200");
  });

  it("hôte invalide : repli", () => {
    expect(requestOrigin(new Headers({ host: "evil.example/path" }), fallback)).toBe(fallback);
    expect(requestOrigin(new Headers(), fallback)).toBe(fallback);
  });
});
