import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const SECRET = "s".repeat(32);
const TOKEN = "phc_abc123XYZ";
const DATABASE_URL = "postgresql://postgres.ref:mdp@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
const COMPLETE = { NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: TOKEN, CRON_SECRET: SECRET, DATABASE_URL };
const DEFAULT_HOST = { NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com" };

describe("parseEnv", () => {
  it("accepte un environnement local sans aucune variable (hôte PostHog UE par défaut)", () => {
    expect(parseEnv({})).toEqual(DEFAULT_HOST);
  });

  it("traite une chaîne vide comme une variable absente", () => {
    expect(parseEnv({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "", NEXT_PUBLIC_POSTHOG_HOST: "", CRON_SECRET: "" })).toEqual(
      DEFAULT_HOST,
    );
  });

  it("exige la clé PostHog, CRON_SECRET et DATABASE_URL en production", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production" })).toThrow(/NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, CRON_SECRET, DATABASE_URL/);
    expect(parseEnv({ VERCEL_ENV: "production", ...COMPLETE })).toMatchObject(COMPLETE);
  });

  it.each(["preview", "development"])("n'exige rien quand VERCEL_ENV=%s", (vercelEnv) => {
    expect(parseEnv({ VERCEL_ENV: vercelEnv })).toEqual({ VERCEL_ENV: vercelEnv, ...DEFAULT_HOST });
  });

  it("refuse un CRON_SECRET trop court sans révéler sa valeur", () => {
    expect(() => parseEnv({ CRON_SECRET: "trop-court-123" })).toThrow(/CRON_SECRET/);
    expect(() => parseEnv({ CRON_SECRET: "trop-court-123" })).not.toThrow(/trop-court-123/);
  });

  it.each(["phx_cle-personnelle", "pas-une-cle", "phc_"])("refuse une clé PostHog qui n'est pas une clé de projet : %s", (token) => {
    expect(() => parseEnv({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: token })).toThrow(/NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN/);
  });

  it.each(["pas-une-url", "javascript:alert(1)", "http://eu.i.posthog.com"])("refuse un hôte PostHog non https : %s", (host) => {
    expect(() => parseEnv({ NEXT_PUBLIC_POSTHOG_HOST: host })).toThrow(/NEXT_PUBLIC_POSTHOG_HOST/);
  });

  it.each(["https://exemple.fr/db", "pas-une-url", "mysql://u:p@h/db"])("refuse une DATABASE_URL qui n'est pas PostgreSQL : %s", (url) => {
    expect(() => parseEnv({ DATABASE_URL: url })).toThrow(/DATABASE_URL/);
  });

  it("n'affiche jamais le mot de passe de la base dans l'erreur", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production", DATABASE_URL: "postgresql://u:secret-mdp@h/db" })).not.toThrow(/secret-mdp/);
  });
});
