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
});

const REQUIRED_IN_PRODUCTION = ["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN", "CRON_SECRET"] as const;

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
