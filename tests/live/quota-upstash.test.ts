import { randomUUID } from "node:crypto";

import { Redis } from "@upstash/redis";
import { afterAll, describe, expect, it } from "vitest";

import { createRedisQuotaStore } from "@/server/quota/quota-store";

// Script de réservation sur le vrai Upstash : atomicité sous concurrence, plancher à 0, expiration posée.
const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! });
const store = createRedisQuotaStore(redis);
const key = `quota:test:${randomUUID()}:2099-01-01`;
const expiresAtMs = Date.now() + 10 * 60 * 1000;

afterAll(async () => {
  await redis.del(key);
});

describe("quota Upstash (en direct)", () => {
  it("20 réservations simultanées pour une limite de 3 : exactement 3 aboutissent", async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => store.reserve(key, 3, expiresAtMs)));
    expect(results.filter((result) => result.reserved)).toHaveLength(3);
    expect(await store.used(key)).toBe(3);
    expect(await redis.ttl(key)).toBeGreaterThan(0);
  });

  it("libère sans jamais descendre sous 0", async () => {
    for (let index = 0; index < 5; index++) await store.release(key);
    expect(await store.used(key)).toBe(0);
  });
});
