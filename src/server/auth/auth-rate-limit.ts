import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/server/cache/redis";
import type { RateLimitResult } from "@/server/http/rate-limit";
import { log } from "@/server/log";

// Limitation de débit des formulaires de compte, par adresse IP (CDC 18.1, context/plans/U04.md décision 7) :
// 20 tentatives de connexion par heure ; 5 envois d'email (inscription, mot de passe oublié) par heure.
// Redis en production ; en local et en CI (sans Upstash), compteur en mémoire du processus.

export const LOGIN_ATTEMPTS_PER_HOUR = 20;
export const EMAIL_SENDS_PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;
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

function build(name: string, max: number): AttemptLimiter {
  const redis = getRedis();
  if (!redis) {
    return createMemoryLimiter(max, HOUR_MS);
  }
  return createRedisLimiter(
    new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(max, "1 h"),
      prefix: `rl:auth:${name}`,
      analytics: false,
      timeout: RATE_LIMIT_TIMEOUT_MS,
    }),
    name,
  );
}

let login: AttemptLimiter | undefined;
let email: AttemptLimiter | undefined;

export function loginLimiter(): AttemptLimiter {
  login ??= build("login", LOGIN_ATTEMPTS_PER_HOUR);
  return login;
}

export function emailLimiter(): AttemptLimiter {
  email ??= build("email", EMAIL_SENDS_PER_HOUR);
  return email;
}
