import "server-only";

import type { Redis } from "@upstash/redis";

// Stockage des compteurs de quota (architecture.md, AD-06) : la réservation est atomique, pour que deux
// requêtes simultanées ne dépassent jamais la limite (critère de fin de U11).

export type ReserveResult = { reserved: boolean; used: number };

export interface QuotaStore {
  /** Ajoute 1 si le compteur reste ≤ `limit` ; sinon ne change rien. Pose l'expiration à la création. */
  reserve(key: string, limit: number, expiresAtMs: number): Promise<ReserveResult>;
  /** Retire 1, sans jamais descendre sous 0 (clé expirée entre-temps : rien à faire). */
  release(key: string): Promise<void>;
  used(key: string): Promise<number>;
}

// Script exécuté d'un bloc par Redis : incrément, expiration à la création, annulation si la limite est dépassée.
const RESERVE_SCRIPT = `
local used = redis.call('INCR', KEYS[1])
if used == 1 then redis.call('EXPIREAT', KEYS[1], ARGV[2]) end
if used > tonumber(ARGV[1]) then
  redis.call('DECR', KEYS[1])
  return {0, used - 1}
end
return {1, used}
`;

const RELEASE_SCRIPT = `
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
if used > 0 then return redis.call('DECR', KEYS[1]) end
return 0
`;

export function createRedisQuotaStore(redis: Redis): QuotaStore {
  return {
    async reserve(key, limit, expiresAtMs) {
      const [reserved, used] = await redis.eval<[number, number], [number, number]>(RESERVE_SCRIPT, [key], [
        limit,
        Math.ceil(expiresAtMs / 1000),
      ]);
      return { reserved: reserved === 1, used };
    },
    async release(key) {
      await redis.eval<[], number>(RELEASE_SCRIPT, [key], []);
    },
    async used(key) {
      return Number((await redis.get<number | string>(key)) ?? 0);
    },
  };
}

/** Implémentation en mémoire, même sémantique (tests, développement sans Upstash). */
export function createMemoryQuotaStore(now: () => number = Date.now): QuotaStore {
  const counters = new Map<string, { used: number; expiresAtMs: number }>();
  const current = (key: string) => {
    const entry = counters.get(key);
    if (entry && entry.expiresAtMs <= now()) {
      counters.delete(key);
      return undefined;
    }
    return entry;
  };

  return {
    async reserve(key, limit, expiresAtMs) {
      const entry = current(key) ?? { used: 0, expiresAtMs };
      if (entry.used + 1 > limit) {
        return { reserved: false, used: entry.used };
      }
      entry.used += 1;
      counters.set(key, entry);
      return { reserved: true, used: entry.used };
    },
    async release(key) {
      const entry = current(key);
      if (entry && entry.used > 0) {
        entry.used -= 1;
      }
    },
    async used(key) {
      return current(key)?.used ?? 0;
    },
  };
}
