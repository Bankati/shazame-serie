import "server-only";

import { Ratelimit } from "@upstash/ratelimit";

import { getRedis } from "@/server/cache/redis";
import { log } from "@/server/log";

// Limitation de débit par adresse IP (architecture.md, étape 6) : rafales, et contournement du quota visiteur
// par effacement des cookies. La limite journalière reste large : de nombreux mobiles partagent une même IP
// d'opérateur. Sans Upstash (local, CI) : pas de limitation.

const PER_MINUTE = 10;
const PER_DAY = 60;
const RATE_LIMIT_TIMEOUT_MS = 1_500;

type Limiters = { minute: Ratelimit; day: Ratelimit };
let limiters: Limiters | null | undefined;

function getLimiters(): Limiters | null {
  if (limiters === undefined) {
    const redis = getRedis();
    limiters = redis
      ? {
          minute: new Ratelimit({
            redis,
            limiter: Ratelimit.slidingWindow(PER_MINUTE, "1 m"),
            prefix: "rl:identify:minute",
            analytics: false,
            timeout: RATE_LIMIT_TIMEOUT_MS,
          }),
          day: new Ratelimit({
            redis,
            limiter: Ratelimit.fixedWindow(PER_DAY, "1 d"),
            prefix: "rl:identify:day",
            analytics: false,
            timeout: RATE_LIMIT_TIMEOUT_MS,
          }),
        }
      : null;
  }
  return limiters;
}

export type RateLimitResult = { ok: true } | { ok: false; retryAt: Date };

export async function checkIdentifyRateLimit(ip: string): Promise<RateLimitResult> {
  const current = getLimiters();
  if (!current) {
    return { ok: true };
  }
  try {
    for (const limiter of [current.minute, current.day]) {
      const result = await limiter.limit(ip);
      await result.pending;
      if (!result.success) {
        return { ok: false, retryAt: new Date(result.reset) };
      }
    }
    return { ok: true };
  } catch {
    // Redis indisponible : on laisse passer (le quota reste appliqué) plutôt que de bloquer tout le monde.
    log.warn("rate_limit.unavailable");
    return { ok: true };
  }
}

/** Adresse IP du client derrière le proxy Vercel (première adresse de x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
