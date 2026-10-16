import "server-only";

import { z } from "zod";

import { POSTHOG_DEFAULT_HOST } from "@/shared/observability/posthog";

// Chaque unité ajoute ici les variables qu'elle utilise (context/plans/U01.md, décision 4).
// Les variables marquées « production » sont obligatoires quand VERCEL_ENV vaut production ;
// facultatives en preview, en local et en CI pour que le build passe sans secrets (context/plans/OBS.md).

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema.optional());

const httpsUrl = () => z.url({ protocol: /^https$/ });

const envSchema = z.object({
  VERCEL_ENV: optional(z.enum(["development", "preview", "production"])),
  // Clé de projet PostHog (phc_…) : publique par nature, elle ne permet que d'envoyer des événements.
  NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: optional(z.string().regex(/^phc_\w+$/)),
  NEXT_PUBLIC_POSTHOG_HOST: z.preprocess(emptyToUndefined, httpsUrl().default(POSTHOG_DEFAULT_HOST)),
  CRON_SECRET: optional(z.string().min(32)),
  // Base applicative (U10). Sur Vercel : URL du pooler Supabase en mode transaction (port 6543).
  DATABASE_URL: optional(z.url({ protocol: /^postgres(ql)?$/ })),
  // TMDB (U08) : jeton de lecture « API Read Access Token » (JWT), jamais la clé courte v3.
  TMDB_API_TOKEN: optional(z.string().regex(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/)),
  // Upstash Redis (U08 cache TMDB, U11 quotas). Région eu-west-1, à côté de la base.
  UPSTASH_REDIS_REST_URL: optional(httpsUrl()),
  UPSTASH_REDIS_REST_TOKEN: optional(z.string().min(20)),
  // OpenAI (U07) : clé de projet « sk-… » ; modèle et niveau de détail calibrés par l'eval (Q4, AD-31).
  OPENAI_API_KEY: optional(z.string().regex(/^sk-[\w-]{20,}$/)),
  OPENAI_VISION_MODEL: z.preprocess(emptyToUndefined, z.string().min(1).default("gpt-6.1-sol")),
  OPENAI_IMAGE_DETAIL: z.preprocess(emptyToUndefined, z.enum(["low", "high", "auto", "original"]).default("auto")),
  OPENAI_REASONING_EFFORT: optional(z.enum(["none", "minimal", "low", "medium", "high"])),
  // Supabase Auth (U04) : URL du projet et clé publique « sb_publishable_… » (le navigateur ne s'en sert pas :
  // toute l'authentification passe par le serveur). En local : http://127.0.0.1:54321.
  NEXT_PUBLIC_SUPABASE_URL: optional(z.url({ protocol: /^https?$/ })),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optional(z.string().min(20)),
  // Signature du cookie visiteur (U11, RG2). Différent par environnement.
  VISITOR_COOKIE_SECRET: optional(z.string().min(32)),
});

const REQUIRED_IN_PRODUCTION = [
  "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN",
  "CRON_SECRET",
  "DATABASE_URL",
  "TMDB_API_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "OPENAI_API_KEY",
  "VISITOR_COOKIE_SECRET",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw invalidEnv(parsed.error.issues.map((issue) => issue.path.join(".")));
  }

  const production = parsed.data.VERCEL_ENV === "production";
  const missing = production ? REQUIRED_IN_PRODUCTION.filter((key) => parsed.data[key] === undefined) : [];
  if (missing.length > 0) {
    throw invalidEnv(missing);
  }

  return parsed.data;
}

// Seuls les noms des variables sont cités, jamais leurs valeurs.
function invalidEnv(keys: readonly string[]): Error {
  return new Error(`Variables d'environnement invalides ou manquantes : ${keys.join(", ")}`);
}

export const env = parseEnv(process.env);
