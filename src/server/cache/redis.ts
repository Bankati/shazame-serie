import "server-only";

import { Redis } from "@upstash/redis";
import type { z } from "zod";

import { env } from "@/server/env";
import { log } from "@/server/log";

// Upstash Redis (REST). Ici, cache de réponses externes (TMDB) ; les quotas (U11) réutiliseront `getRedis`.
// Le cache est un accélérateur : une panne Redis ne doit jamais faire échouer la requête.
const REDIS_TIMEOUT_MS = 1_500;
const REDIS_RETRIES = 1;

let redis: Redis | null | undefined;

/** Client Redis, ou null quand Upstash n'est pas configuré (local, CI). */
export function getRedis(): Redis | null {
  if (redis === undefined) {
    redis =
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? new Redis({
            url: env.UPSTASH_REDIS_REST_URL,
            token: env.UPSTASH_REDIS_REST_TOKEN,
            retry: { retries: REDIS_RETRIES },
            signal: () => AbortSignal.timeout(REDIS_TIMEOUT_MS),
            enableTelemetry: false,
          })
        : null;
  }
  return redis;
}

/**
 * Lit `key` dans le cache, sinon calcule la valeur avec `load` et l'écrit pour `ttlSeconds`.
 * Une valeur lue est revalidée par `schema` : une entrée invalide (ancien format, corruption) est ignorée.
 */
export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  schema: z.ZodType<T>,
  load: () => Promise<T>,
): Promise<T> {
  const client = getRedis();
  if (!client) {
    return load();
  }

  try {
    const stored = await client.get<unknown>(key);
    if (stored !== null) {
      const parsed = schema.safeParse(stored);
      if (parsed.success) {
        return parsed.data;
      }
      log.warn("cache.invalid_entry", { prefix: keyPrefix(key) });
    }
  } catch {
    log.warn("cache.read_failed", { prefix: keyPrefix(key) });
  }

  const value = await load();
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch {
    log.warn("cache.write_failed", { prefix: keyPrefix(key) });
  }
  return value;
}

// Seul le préfixe part dans les journaux : la clé complète peut contenir le texte d'une recherche.
function keyPrefix(key: string): string {
  return key.split(":").slice(0, 2).join(":");
}
