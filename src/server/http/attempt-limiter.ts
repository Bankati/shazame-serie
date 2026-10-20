import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/server/cache/redis";
import type { RateLimitResult } from "@/server/http/rate-limit";
import { log } from "@/server/log";

// Limiteurs par clé (adresse IP le plus souvent) : formulaires de compte (U04), recherche de titres et
// signalements (U20). Redis en production ; en local et en CI (sans Upstash), compteur en mémoire.

type Window = "1 m" | "1 h";
const WINDOW_MS: Record<Window, number> = { "1 m": 60 * 1000, "1 h": 60 * 60 * 1000 };
const RATE_LIMIT_TIMEOUT_MS = 1_500;

export type AttemptLimiter = { consume(key: string): Promise<RateLimitResult> };

/** Fenêtre fixe en mémoire : suffisante pour un seul processus (local, CI, tests). */
export function createMemoryLimiter(max: number, windowMs: number, now: () => number = Date.now): AttemptLimiter {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    async consume(key) {
      const time = now();
      const current = windows.get(key);
      const window = current && time - current.start < windowMs ? current : { start: time, count: 0 };
      window.count += 1;
      windows.set(key, window);
      return window.count <= max ? { ok: true } : { ok: false, retryAt: new Date(window.start + windowMs) };
    },
  };
}

function createRedisLimiter(ratelimit: Ratelimit, name: string): AttemptLimiter {
  return {
    async consume(key) {
      try {
        const result = await ratelimit.limit(key);
        await result.pending;
        return result.success ? { ok: true } : { ok: false, retryAt: new Date(result.reset) };
      } catch {
        // Redis indisponible : on laisse passer ; Supabase Auth applique aussi ses propres limites.
        log.warn("rate_limit.unavailable", { limiter: name });
        return { ok: true };
      }
    },
  };
}

/** Limiteur nommé : `max` tentatives par fenêtre (une heure par défaut). */
export function buildLimiter(name: string, max: number, window: Window = "1 h"): AttemptLimiter {
  const redis = getRedis();
  if (!redis) {
    return createMemoryLimiter(max, WINDOW_MS[window]);
  }
  return createRedisLimiter(
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, window),
      prefix: `rl:${name}`,
      analytics: false,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
    name,
  );
}

