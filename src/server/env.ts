import "server-only";

import { z } from "zod";

// Chaque unité ajoute ici les variables qu'elle utilise (context/plans/U01.md, décision 4).
// Les variables marquées « déployées » sont obligatoires quand VERCEL_ENV vaut preview ou production,
// facultatives en local et en CI pour que le build passe sans secrets.

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const optional = <T extends z.ZodType>(schema: T) => z.preprocess(emptyToUndefined, schema.optional());

const envSchema = z.object({
  VERCEL_ENV: optional(z.enum(["development", "preview", "production"])),
  SENTRY_DSN: optional(z.url()),
  NEXT_PUBLIC_SENTRY_DSN: optional(z.url()),
  CRON_SECRET: optional(z.string().min(32)),
});

const REQUIRED_WHEN_DEPLOYED = ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN", "CRON_SECRET"] as const;

export type Env = z.infer<typeof envSchema>;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw invalidEnv(parsed.error.issues.map((issue) => issue.path.join(".")));
  }

  const deployed = parsed.data.VERCEL_ENV === "preview" || parsed.data.VERCEL_ENV === "production";
  const missing = deployed ? REQUIRED_WHEN_DEPLOYED.filter((key) => parsed.data[key] === undefined) : [];
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
