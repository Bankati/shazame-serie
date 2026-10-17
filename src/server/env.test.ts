import { describe, expect, it } from "vitest";

import { parseEnv } from "./env";

const SECRET = "s".repeat(32);
const TOKEN = "phc_abc123XYZ";
const DATABASE_URL = "postgresql://postgres.ref:mdp@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
const TMDB_API_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJ0ZXN0In0.c2lnbmF0dXJl";
const COMPLETE = {
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: TOKEN,
  CRON_SECRET: SECRET,
  DATABASE_URL,
  TMDB_API_TOKEN,
  UPSTASH_REDIS_REST_URL: "https://exemple-12345.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "A".repeat(40),
  OPENAI_API_KEY: `sk-proj-${"x".repeat(40)}`,
  VISITOR_COOKIE_SECRET: "v".repeat(32),
  NEXT_PUBLIC_SUPABASE_URL: "https://exemple.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: `sb_publishable_${"p".repeat(24)}`,
};
const DEFAULT_HOST = {
  NEXT_PUBLIC_POSTHOG_HOST: "https://eu.i.posthog.com",
  OPENAI_VISION_MODEL: "gpt-6.1-sol",
  OPENAI_IMAGE_DETAIL: "auto",
};

describe("parseEnv", () => {
  it("accepte un environnement local sans aucune variable (hôte PostHog UE par défaut)", () => {
    expect(parseEnv({})).toEqual(DEFAULT_HOST);
  });

  it("traite une chaîne vide comme une variable absente", () => {
    expect(parseEnv({ NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: "", NEXT_PUBLIC_POSTHOG_HOST: "", CRON_SECRET: "" })).toEqual(
      DEFAULT_HOST,
    );
  });

  it("refuse le faux serveur TMDB en production", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production", ...COMPLETE, TMDB_API_BASE_URL: "http://127.0.0.1:3299/3" })).toThrow(/TMDB_API_BASE_URL/);
    expect(parseEnv({ TMDB_API_BASE_URL: "http://127.0.0.1:3299/3" }).TMDB_API_BASE_URL).toBe("http://127.0.0.1:3299/3");
  });

  it("exige les variables des services externes en production", () => {
    expect(() => parseEnv({ VERCEL_ENV: "production" })).toThrow(
      /NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, CRON_SECRET, DATABASE_URL, TMDB_API_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, OPENAI_API_KEY, VISITOR_COOKIE_SECRET, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/,
    );
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

  it.each(["3b68536ae2d233abea1ad47d6c2f0e47", "pas-un-jeton"])("refuse un TMDB_API_TOKEN qui n'est pas le jeton de lecture : %s", (token) => {
    expect(() => parseEnv({ TMDB_API_TOKEN: token })).toThrow(/TMDB_API_TOKEN/);
  });

  it.each(["pas-une-cle", "sk-court", "phc_mauvaise_cle_de_service"])("refuse une OPENAI_API_KEY invalide : %s", (key) => {
    expect(() => parseEnv({ OPENAI_API_KEY: key })).toThrow(/OPENAI_API_KEY/);
  });

  it("refuse un niveau de détail d'image inconnu", () => {
    expect(() => parseEnv({ OPENAI_IMAGE_DETAIL: "ultra" })).toThrow(/OPENAI_IMAGE_DETAIL/);
  });
});
