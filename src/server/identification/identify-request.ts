import "server-only";

import { cookies } from "next/headers";

import { getGuardedVisionProviderOrNull } from "@/server/ai/vision";
import { getCurrentAccount } from "@/server/auth/guards";
import { newVisitorId, signVisitorId, VISITOR_COOKIE, VISITOR_COOKIE_OPTIONS, verifyVisitorCookie } from "@/server/auth/visitor";
import { getRedis } from "@/server/cache/redis";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { getDb } from "@/server/db/client";
import { jsonError, jsonOk } from "@/server/http/respond";
import { checkIdentifyRateLimit, clientIp } from "@/server/http/rate-limit";
import { isSameOrigin } from "@/server/http/same-origin";
import { log } from "@/server/log";
import { errorCode } from "@/server/log-error";
import { createQuotaService, type QuotaIdentity, type QuotaService } from "@/server/quota/quota";
import { createMemoryQuotaStore, createRedisQuotaStore } from "@/server/quota/quota-store";
import { loadQuotaLimits } from "@/server/quota/settings";
import { describeRequestSchema } from "@/schemas/describe";
import { frameModeSchema } from "@/schemas/identify";
import { linkRequestSchema } from "@/schemas/link";
import { env } from "@/server/env";
import {
  fetchThumbnail,
  fetchTikTokMetadata,
  fetchYouTubeMetadata,
  resolveTikTokShortLink,
} from "@/server/links/link-metadata";
import { parseVideoLink } from "@/shared/links/parse-link";

import {
  type IdentifyDeps,
  identifyClip,
  identifyDescription,
  identifyLink,
  type IdentifyOutcome,
  type LinkSources,
  toQuotaInfo,
} from "./identify";
import { persistIdentification } from "./persist";
import { findCachedResult, prepareCacheLookup, recordCacheHit, storeCachedResult } from "./result-cache";
import { minFrames, validateFrames } from "./validate-frames";

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

type Requester = { identity: QuotaIdentity; suspended: boolean };

/**
 * Compte connecté (quota gratuit ; Premium en U22), sinon visiteur du cookie signé, créé s'il est absent ou
 * invalide. Un email non confirmé n'ouvre pas de session : il reste visiteur (Q14).
 */
async function currentRequester(): Promise<Requester> {
  const account = await getCurrentAccount();
  if (account) {
    return { identity: { kind: "user", id: account.id, plan: "free" }, suspended: account.status === "suspended" };
  }
  return { identity: await visitorIdentity(), suspended: false };
}

async function visitorIdentity(): Promise<QuotaIdentity> {
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
  // Protection CSRF (code-standards.md) : seul le site lui-même peut envoyer des images à identifier.
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN");
  }

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
  // Mode (U34) : clip (2 à 5 images) ou captures (1 à 5). Absent : clip, comme avant U34.
  const mode = frameModeSchema.safeParse(form.get("mode") ?? undefined);
  if (!mode.success) {
    return jsonError("VALIDATION_ERROR");
  }
  const frames = await validateFrames(form.getAll("frames"), { minCount: minFrames(mode.data) });
  if (!frames.ok) {
    return frames.reason === "count" ? jsonError("FRAMES_UNUSABLE") : jsonError("VALIDATION_ERROR");
  }

  const vision = getGuardedVisionProviderOrNull();
  if (!vision) {
    log.error("identify.vision_not_configured");
    return jsonError("UPSTREAM_ERROR");
  }

  // Session et statut : un compte suspendu ne peut pas identifier (architecture.md).
  const { identity, suspended } = await currentRequester();
  if (suspended) {
    return jsonError("ACCOUNT_SUSPENDED");
  }

  const db = getDb();
  const outcome = await identifyClip(
    {
      quota: getQuotaService(),
      vision,
      catalog: getCatalog(),
      prepareLookup: prepareCacheLookup,
      cache: cacheDeps(db),
      persist: (record) => persistIdentification(db, record),
    },
    { identity, images: frames.images, mode: mode.data },
  );

  return outcomeResponse(outcome);
}

/** Cache de résultats (images et liens) : une écriture ratée ne prive jamais l'utilisateur de son résultat. */
function cacheDeps(db: ReturnType<typeof getDb>): IdentifyDeps["cache"] {
  return {
    find: (lookup) => findCachedResult(db, lookup),
    recordHit: async (cacheId) => {
      await recordCacheHit(db, cacheId).catch(() => log.warn("result_cache.write_failed", { step: "record_hit" }));
    },
    store: async (lookup, result) => {
      await storeCachedResult(db, lookup, result).catch(() => log.warn("result_cache.write_failed", { step: "store" }));
    },
  };
}

/**
 * POST /api/identify/description (U35) : même ordre que les images (origine, débit, validation, IA configurée,
 * compte suspendu), puis quota et décompte communs. Le texte n'est jamais journalisé (invariant 9).
 */
export async function handleDescribeRequest(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN");
  }
  const rate = await checkIdentifyRateLimit(clientIp(request.headers));
  if (!rate.ok) {
    return jsonError("RATE_LIMITED", undefined, { headers: { "Retry-After": retryAfterSeconds(rate.retryAt) } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("VALIDATION_ERROR");
  }
  const parsed = describeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR");
  }

  const vision = getGuardedVisionProviderOrNull();
  if (!vision) {
    log.error("identify.vision_not_configured");
    return jsonError("UPSTREAM_ERROR");
  }
  const { identity, suspended } = await currentRequester();
  if (suspended) {
    return jsonError("ACCOUNT_SUSPENDED");
  }

  const db = getDb();
  const outcome = await identifyDescription(
    { quota: getQuotaService(), vision, catalog: getCatalog(), persist: (record) => persistIdentification(db, record) },
    { identity, text: parsed.data.text },
  );
  return outcomeResponse(outcome);
}

/**
 * POST /api/identify/link (U36) : même ordre de contrôles. Le lien est analysé (plateforme, identifiant) avant
 * tout appel ; le serveur n'ouvre jamais l'adresse donnée (AD-44). Ni l'adresse ni les métadonnées ne sont
 * journalisées, seulement la plateforme (invariant 9).
 */
export async function handleLinkRequest(request: Request, sources: LinkSources = liveLinkSources()): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN");
  }
  const rate = await checkIdentifyRateLimit(clientIp(request.headers));
  if (!rate.ok) {
    return jsonError("RATE_LIMITED", undefined, { headers: { "Retry-After": retryAfterSeconds(rate.retryAt) } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("VALIDATION_ERROR");
  }
  const parsed = linkRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("VALIDATION_ERROR");
  }
  const link = parseVideoLink(parsed.data.url);
  if (!link.ok) {
    return jsonError("LINK_UNSUPPORTED", undefined, undefined, { reason: link.reason });
  }

  const vision = getGuardedVisionProviderOrNull();
  if (!vision) {
    log.error("identify.vision_not_configured");
    return jsonError("UPSTREAM_ERROR");
  }
  const { identity, suspended } = await currentRequester();
  if (suspended) {
    return jsonError("ACCOUNT_SUSPENDED");
  }

  const db = getDb();
  const outcome = await identifyLink(
    {
      quota: getQuotaService(),
      vision,
      catalog: getCatalog(),
      persist: (record) => persistIdentification(db, record),
      cache: cacheDeps(db),
    },
    sources,
    { identity, link },
  );
  return outcomeResponse(outcome);
}

function liveLinkSources(): LinkSources {
  return {
    resolveShort: (shortUrl) => resolveTikTokShortLink(shortUrl),
    metadata: (platform, videoId, canonicalUrl) =>
      platform === "youtube" ? fetchYouTubeMetadata(videoId, env.YOUTUBE_API_KEY) : fetchTikTokMetadata(videoId, canonicalUrl),
    thumbnail: (url, platform) => fetchThumbnail(url, platform),
  };
}

function outcomeResponse(outcome: IdentifyOutcome): Response {
  if (outcome.ok) {
    return jsonOk(outcome.response);
  }
  if (outcome.code === "QUOTA_EXCEEDED") {
    return jsonError("QUOTA_EXCEEDED", undefined, undefined, { quota: outcome.quota });
  }
  if (outcome.code === "AI_PAUSED" || outcome.code === "LINK_NOT_FOUND" || outcome.code === "LINK_NO_CLUES") {
    return jsonError(outcome.code);
  }
  return jsonError("UPSTREAM_ERROR");
}

export async function handleQuotaRequest(): Promise<Response> {
  let status: Awaited<ReturnType<QuotaService["status"]>>;
  try {
    status = await getQuotaService().status((await currentRequester()).identity);
  } catch (error) {
    // Redis ou base injoignable : le compteur n'est pas affiché, l'identification reste contrôlée par le
    // serveur. Le code technique (ex. 28P01 : mot de passe de la base refusé) aide au diagnostic.
    log.warn("quota.status_unavailable", { code: errorCode(error) });
    return jsonError("UPSTREAM_ERROR", undefined, { headers: { "Cache-Control": "no-store" } });
  }
  return jsonOk(toQuotaInfo(status), { headers: { "Cache-Control": "no-store" } });
}

function retryAfterSeconds(retryAt: Date): string {
  return String(Math.max(1, Math.ceil((retryAt.getTime() - Date.now()) / 1000)));
}
