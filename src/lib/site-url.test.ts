import { afterEach, describe, expect, it, vi } from "vitest";

import { siteUrl } from "./site-url";

describe("siteUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("préfère NEXT_PUBLIC_SITE_URL, sans barre finale", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://exemple.fr/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "projet.vercel.app");
    expect(siteUrl()).toBe("https://exemple.fr");
  });

  it("utilise l'adresse de production Vercel, sinon localhost", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "projet.vercel.app");
    expect(siteUrl()).toBe("https://projet.vercel.app");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
    expect(siteUrl()).toBe("http://localhost:3000");
  });
});
