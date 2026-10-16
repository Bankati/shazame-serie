import "server-only";

import type { Redis } from "@upstash/redis";

// Compteur de dépense IA du jour (RG5, architecture.md : `ai:spend:{jour Paris}`), en micro-euros.
// La réservation est atomique : des requêtes simultanées ne dépassent jamais le plafond.

export type SpendReservation = { reserved: boolean; spent: number };

export interface SpendStore {
  /** Ajoute `amount` si la dépense reste ≤ `cap` ; sinon ne change rien. Pose l'expiration à la création. */
  reserve(key: string, amount: number, cap: number, expiresAtMs: number): Promise<SpendReservation>;
  /** Ajoute `delta` (négatif pour rendre une réservation trop large), sans jamais descendre sous 0. */
  adjust(key: string, delta: number): Promise<void>;
  spent(key: string): Promise<number>;
  /** Vrai la première fois seulement (alerte unique par jour). */
  markOnce(key: string, expiresAtMs: number): Promise<boolean>;
}

const RESERVE_SCRIPT = `
local spent = tonumber(redis.call('GET', KEYS[1]) or '0')
local amount = tonumber(ARGV[1])
if spent + amount > tonumber(ARGV[2]) then return {0, spent} end
local total = redis.call('INCRBY', KEYS[1], amount)
if total == amount then redis.call('EXPIREAT', KEYS[1], ARGV[3]) end
return {1, total}
`;

const ADJUST_SCRIPT = `
local spent = tonumber(redis.call('GET', KEYS[1]) or '0')
local total = math.max(0, spent + tonumber(ARGV[1]))
if redis.call('EXISTS', KEYS[1]) == 1 then redis.call('SET', KEYS[1], total, 'KEEPTTL') end
return total
`;

export function createRedisSpendStore(redis: Redis): SpendStore {
  return {
    async reserve(key, amount, cap, expiresAtMs) {
      const [reserved, spent] = await redis.eval<[number, number, number], [number, number]>(RESERVE_SCRIPT, [key], [
        amount,
        cap,
        Math.ceil(expiresAtMs / 1000),
      ]);
      return { reserved: reserved === 1, spent };
    },
    async adjust(key, delta) {
      if (delta !== 0) {
        await redis.eval<[number], number>(ADJUST_SCRIPT, [key], [delta]);
      }
    },
    async spent(key) {
      return Number((await redis.get<number | string>(key)) ?? 0);
    },
    async markOnce(key, expiresAtMs) {
      return (await redis.set(key, "1", { nx: true, pxat: expiresAtMs })) === "OK";
    },
  };
}

/** Même sémantique, en mémoire (tests, développement sans Upstash). */
export function createMemorySpendStore(now: () => number = Date.now): SpendStore {
  const counters = new Map<string, { value: number; expiresAtMs: number }>();
  const current = (key: string) => {
    const entry = counters.get(key);
    if (entry && entry.expiresAtMs <= now()) {
      counters.delete(key);
      return undefined;
    }
    return entry;
  };

  return {
    async reserve(key, amount, cap, expiresAtMs) {
      const entry = current(key) ?? { value: 0, expiresAtMs };
      if (entry.value + amount > cap) {
        return { reserved: false, spent: entry.value };
      }
      entry.value += amount;
      counters.set(key, entry);
      return { reserved: true, spent: entry.value };
    },
    async adjust(key, delta) {
      const entry = current(key);
      if (entry) {
        entry.value = Math.max(0, entry.value + delta);
      }
    },
    async spent(key) {
      return current(key)?.value ?? 0;
    },
    async markOnce(key, expiresAtMs) {
      if (current(key)) {
        return false;
      }
      counters.set(key, { value: 1, expiresAtMs });
      return true;
    },
  };
}
