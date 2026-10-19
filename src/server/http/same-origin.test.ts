import { describe, expect, it } from "vitest";

import { isSameOrigin } from "./same-origin";

const post = (headers: Record<string, string>) => new Request("https://site.example/auth/deconnexion", { method: "POST", headers });

describe("isSameOrigin", () => {
  it("accepte une requête venant du site", () => {
    expect(isSameOrigin(post({ origin: "https://site.example", host: "site.example" }))).toBe(true);
    expect(isSameOrigin(post({ origin: "https://preview.vercel.app", host: "interne", "x-forwarded-host": "preview.vercel.app" }))).toBe(true);
  });

  it("refuse une autre origine ou une origine absente", () => {
    expect(isSameOrigin(post({ origin: "https://evil.example", host: "site.example" }))).toBe(false);
    expect(isSameOrigin(post({ host: "site.example" }))).toBe(false);
    expect(isSameOrigin(post({ origin: "null", host: "site.example" }))).toBe(false);
  });
});
