import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const SECRET = "s".repeat(32);
const DSN = "https://key@o1.ingest.sentry.io/1";
const COMPLETE = { SENTRY_DSN: DSN, NEXT_PUBLIC_SENTRY_DSN: DSN, CRON_SECRET: SECRET };

describe("parseEnv", () => {
  it("accepte un environnement local sans aucune variable", () => {
    expect(parseEnv({})).toEqual({});
  });

  it("traite une chaîne vide comme une variable absente", () => {
    expect(parseEnv({ SENTRY_DSN: "", CRON_SECRET: "" })).toEqual({});
  });

  it.each(["preview", "production"])("exige les variables déployées quand VERCEL_ENV=%s", (vercelEnv) => {
    expect(() => parseEnv({ VERCEL_ENV: vercelEnv })).toThrow(/SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, CRON_SECRET/);
    expect(parseEnv({ VERCEL_ENV: vercelEnv, ...COMPLETE })).toMatchObject(COMPLETE);
  });

  it("n'exige rien quand VERCEL_ENV=development", () => {
    expect(parseEnv({ VERCEL_ENV: "development" })).toEqual({ VERCEL_ENV: "development" });
  });

  it("refuse un CRON_SECRET trop court sans révéler sa valeur", () => {
    expect(() => parseEnv({ CRON_SECRET: "trop-court-123" })).toThrow(/CRON_SECRET/);
    expect(() => parseEnv({ CRON_SECRET: "trop-court-123" })).not.toThrow(/trop-court-123/);
  });

  it.each(["pas-une-url", "javascript:alert(1)", "http://key@o1.ingest.sentry.io/1"])(
    "refuse un DSN qui n'est pas une URL https : %s",
    (dsn) => {
      expect(() => parseEnv({ SENTRY_DSN: dsn })).toThrow(/SENTRY_DSN/);
    },
  );
});
