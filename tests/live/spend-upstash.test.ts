import { randomUUID } from "node:crypto";

import { Redis } from "@upstash/redis";
import { afterAll, describe, expect, it } from "vitest";

import { createRedisSpendStore } from "@/server/ai/spend-store";

// Compteur de dépense sur le vrai Upstash : réservations simultanées sous un plafond, ajustement, plancher à 0, alerte unique.
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
const store = createRedisSpendStore(redis);
const key = `ai:spend:test-${randomUUID()}`;
const alertKey = `ai:alert:test-${randomUUID()}`;
const expiresAtMs = Date.now() + 10 * 60 * 1000;

afterAll(async () => {
  await redis.del(key, alertKey);
});

describe("dépense IA sur Upstash (en direct)", () => {
  it("20 réservations simultanées de 1 000 sous un plafond de 3 000 : exactement 3 aboutissent", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => store.reserve(key, 1_000, 3_000, expiresAtMs)));
    expect(results.filter((result) => result.reserved)).toHaveLength(3);
    expect(await store.spent(key)).toBe(3_000);
    expect(await redis.ttl(key)).toBeGreaterThan(0);
  });

  it("ajuste au coût réel sans jamais descendre sous 0, en gardant l'expiration", async () => {
    await store.adjust(key, -2_500);
    expect(await store.spent(key)).toBe(500);
    await store.adjust(key, -10_000);
    expect(await store.spent(key)).toBe(0);
    expect(await redis.ttl(key)).toBeGreaterThan(0);
  });

  it("ne déclenche l'alerte qu'une fois", async () => {
    expect(await store.markOnce(alertKey, expiresAtMs)).toBe(true);
    expect(await store.markOnce(alertKey, expiresAtMs)).toBe(false);
  });
});
