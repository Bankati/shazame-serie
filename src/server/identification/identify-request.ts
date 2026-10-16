import "server-only";

import { cookies } from "next/headers";

import { getGuardedVisionProviderOrNull } from "@/server/ai/vision";
import { newVisitorId, signVisitorId, VISITOR_COOKIE, VISITOR_COOKIE_OPTIONS, verifyVisitorCookie } from "@/server/auth/visitor";
import { getRedis } from "@/server/cache/redis";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { getDb } from "@/server/db/client";
import { jsonError, jsonOk } from "@/server/http/respond";
import { checkIdentifyRateLimit, clientIp } from "@/server/http/rate-limit";
import { log } from "@/server/log";
import { createQuotaService, type QuotaIdentity, type QuotaService } from "@/server/quota/quota";
import { createMemoryQuotaStore, createRedisQuotaStore } from "@/server/quota/quota-store";
import { loadQuotaLimits } from "@/server/quota/settings";
import type { QuotaInfo } from "@/schemas/identify";

import { identifyClip } from "./identify";
import { persistIdentification } from "./persist";
import { findCachedResult, prepareCacheLookup, recordCacheHit, storeCachedResult } from "./result-cache";
import { validateFrames } from "./validate-frames";

// Traitement HTTP de POST /api/identify et GET /api/quota (la route ne fait qu'appeler ces fonctions, invariant 8).

let quotaService: QuotaService | undefined;
// Sans Upstash (local sans clés, CI), compteurs en mémoire : jamais en production (env.ts exige Upstash).
const memoryStore = createMemoryQuotaStore();

function getQuotaService(): QuotaService {
  if (!quotaService) {
    const redis = getRedis();
    quotaService = createQuotaService({
      store: redis ? createRedisQuotaStore(redis) : memoryStore,
      limits: () => loadQuotaLimits(getDb()),
    });
  }
  return quotaService;
}

/** Visiteur du cookie signé, créé s'il est absent ou invalide. En U04, un compte connecté passera avant. */
async function currentIdentity(): Promise<QuotaIdentity> {
  const jar = await cookies();
  const existing = verifyVisitorCookie(jar.get(VISITOR_COOKIE)?.value);
  if (existing) {
    return { kind: "visitor", id: existing };
  }
  const id = newVisitorId();
  jar.set(VISITOR_COOKIE, signVisitorId(id), VISITOR_COOKIE_OPTIONS);
  return { kind: "visitor", id };
}

export async function handleIdentifyRequest(request: Request): Promise<Response> {
  // 6. Limitation de débit par IP.
  const rate = await checkIdentifyRateLimit(clientIp(request.headers));
  if (!rate.ok) {
    return jsonError("RATE_LIMITED", undefined, { headers: { "Retry-After": retryAfterSeconds(rate.retryAt) } });
  }

  // 7. Images : nombre, taille, type réel (invariant 1).
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("VALIDATION_ERROR");
  }
  const frames = await validateFrames(form.getAll("frames"));
  if (!frames.ok) {
    return frames.reason === "count" ? jsonError("FRAMES_UNUSABLE") : jsonError("VALIDATION_ERROR");
  }

  const vision = getGuardedVisionProviderOrNull();
  if (!vision) {
    log.error("identify.vision_not_configured");
    return jsonError("UPSTREAM_ERROR");
  }

  const db = getDb();
  const identity = await currentIdentity();
  const outcome = await identifyClip(
    {
      quota: getQuotaService(),
      vision,
      catalog: getCatalog(),
      prepareLookup: prepareCacheLookup,
      cache: {
        find: (lookup) => findCachedResult(db, lookup),
        recordHit: async (cacheId) => {
          await recordCacheHit(db, cacheId).catch(() => log.warn("result_cache.write_failed", { step: "record_hit" }));
        },
        store: async (lookup, result) => {
          await storeCachedResult(db, lookup, result).catch(() => log.warn("result_cache.write_failed", { step: "store" }));
        },
      },
      persist: (record) => persistIdentification(db, record),
    },
    { identity, images: frames.images },
  );

  if (outcome.ok) {
    return jsonOk(outcome.response);
  }
  if (outcome.code === "QUOTA_EXCEEDED") {
    return jsonError("QUOTA_EXCEEDED", undefined, undefined, { quota: outcome.quota });
  }
  if (outcome.code === "AI_PAUSED") {
    return jsonError("AI_PAUSED");
  }
  return jsonError("UPSTREAM_ERROR");
}

export async function handleQuotaRequest(): Promise<Response> {
  const status = await getQuotaService().status(await currentIdentity());
  const quota: QuotaInfo = { limit: status.limit, remaining: status.remaining, resetAt: status.resetAt.toISOString() };
  return jsonOk(quota, { headers: { "Cache-Control": "no-store" } });
}

function retryAfterSeconds(retryAt: Date): string {
  return String(Math.max(1, Math.ceil((retryAt.getTime() - Date.now()) / 1000)));
}
