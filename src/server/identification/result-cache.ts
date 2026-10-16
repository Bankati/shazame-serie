import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { type Database, type DbTransaction, withQueryTimeout } from "@/server/db/client";
import { resultCache, resultCacheFrames, type StoredAlternative } from "@/server/db/schema";
import { log } from "@/server/log";

import { clipFingerprint, computeFrameHashes, toSignedBigint } from "./frame-hashes";

// Cache de résultats (CDC 15.3, RG6, architecture.md « Cache de résultats », AD-29).
// Seules les empreintes et le résultat sont conservés, jamais les images (RG7).

/** Distance de Hamming maximale entre deux images pour les juger « proches » (à calibrer en U13). */
export const CACHE_MAX_HAMMING = 6;
/** Nombre d'images reçues qui doivent être proches d'une entrée pour la retenir. */
export const CACHE_MIN_MATCHING_FRAMES = 2;
/** Confiance minimale (0 à 100) pour écrire un résultat dans le cache, sauf validation admin. */
export const CACHE_MIN_CONFIDENCE = 80;

export type MediaType = "movie" | "tv";

export type CacheableResult = {
  tmdbId: number;
  mediaType: MediaType;
  confidence: number;
  alternatives: StoredAlternative[];
};

export type CachedResult = CacheableResult & { cacheId: string; validated: boolean };

/** Base ou transaction : les fonctions du cache s'exécutent dans `withQueryTimeout`. */
type DbExecutor = Database | DbTransaction;

export type CacheLookup = {
  /** Empreintes d'images calculées par le serveur (non signées). */
  frameHashes: bigint[];
  fingerprint: string;
};

/** Empreintes calculées par le serveur à partir des JPEG reçus (invariant 4). */
export async function prepareCacheLookup(images: readonly Buffer[]): Promise<CacheLookup> {
  const frameHashes = await computeFrameHashes(images);
  return { frameHashes, fingerprint: clipFingerprint(frameHashes) };
}

/** Correspondance exacte (index unique) puis proche, parmi les entrées non désactivées. */
export async function findCachedResult(db: DbExecutor, lookup: CacheLookup): Promise<CachedResult | null> {
  const exact = await db
    .select()
    .from(resultCache)
    .where(and(eq(resultCache.fingerprint, lookup.fingerprint), eq(resultCache.disabled, false)))
    .limit(1);
  if (exact[0]) {
    return toCachedResult(exact[0]);
  }

  return findNearEntry(db, lookup.frameHashes);
}

type NearEntryRow = {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  confidence: number;
  alternatives: StoredAlternative[];
  validated: boolean;
};

/**
 * Entrée dont au moins CACHE_MIN_MATCHING_FRAMES images reçues sont à ≤ CACHE_MAX_HAMMING bits d'une
 * de ses images. En cas d'égalité : plus d'images proches, puis entrée validée, puis distance totale la plus faible.
 */
async function findNearEntry(db: DbExecutor, frameHashes: readonly bigint[]): Promise<CachedResult | null> {
  if (frameHashes.length < CACHE_MIN_MATCHING_FRAMES) {
    return null;
  }
  // Littéral de tableau construit uniquement à partir d'entiers produits par le serveur, passé en paramètre.
  const hashArray = `{${frameHashes.map((hash) => toSignedBigint(hash).toString()).join(",")}}`;

  // Une seule requête : l'entrée retenue est renvoyée directement (pas de relecture).
  const rows = await db.execute<NearEntryRow>(sql`
    select entry.id, entry.tmdb_id, entry.media_type, entry.confidence, entry.alternatives, entry.validated
    from ${resultCacheFrames} as frames
    join ${resultCache} as entry on entry.id = frames.cache_id and not entry.disabled
    join unnest(${hashArray}::bigint[]) as received(hash)
      on bit_count((frames.frame_hash # received.hash)::bit(64)) <= ${CACHE_MAX_HAMMING}
    group by entry.id
    having count(distinct received.hash) >= ${CACHE_MIN_MATCHING_FRAMES}
    order by count(distinct received.hash) desc,
             entry.validated desc,
             sum(bit_count((frames.frame_hash # received.hash)::bit(64))) asc
    limit 1
  `);
  const row = rows[0];
  return row
    ? {
        cacheId: row.id,
        tmdbId: row.tmdb_id,
        mediaType: row.media_type,
        confidence: row.confidence,
        alternatives: row.alternatives,
        validated: row.validated,
      }
    : null;
}

export async function recordCacheHit(db: DbExecutor, cacheId: string): Promise<void> {
  await db
    .update(resultCache)
    .set({ hits: sql`${resultCache.hits} + 1` })
    .where(eq(resultCache.id, cacheId));
}

/**
 * Écrit un résultat dans le cache si sa confiance atteint CACHE_MIN_CONFIDENCE (ou s'il est validé).
 * Un extrait déjà en cache n'est pas réécrit. Renvoie l'identifiant de l'entrée, ou null si rien n'est écrit.
 */
export async function storeCachedResult(
  db: DbExecutor,
  lookup: CacheLookup,
  result: CacheableResult,
  options: { validated?: boolean } = {},
): Promise<string | null> {
  const validated = options.validated ?? false;
  if (!validated && result.confidence < CACHE_MIN_CONFIDENCE) {
    return null;
  }

  return db.transaction(async (tx) => {
    const inserted = await tx
      .insert(resultCache)
      .values({
        fingerprint: lookup.fingerprint,
        tmdbId: result.tmdbId,
        mediaType: result.mediaType,
        confidence: result.confidence,
        alternatives: result.alternatives,
        validated,
      })
      .onConflictDoNothing({ target: resultCache.fingerprint })
      .returning({ id: resultCache.id });

    const cacheId = inserted[0]?.id;
    if (!cacheId) {
      return null;
    }

    // Clé primaire (cache_id, frame_hash) : deux images identiques ne donnent qu'une ligne.
    const uniqueHashes = [...new Set(lookup.frameHashes.map((hash) => toSignedBigint(hash)))];
    await tx.insert(resultCacheFrames).values(uniqueHashes.map((frameHash) => ({ cacheId, frameHash })));
    return cacheId;
  });
}

/** Désactive une entrée signalée : elle ne répond plus jusqu'à revue admin (architecture.md). */
export async function disableCachedResult(db: DbExecutor, cacheId: string): Promise<void> {
  await db.update(resultCache).set({ disabled: true }).where(eq(resultCache.id, cacheId));
}

export type CacheOutcome<T extends CacheableResult> =
  | { source: "cache"; result: CachedResult }
  | { source: "ai"; result: T; cacheId: string | null };

/**
 * Point d'entrée du flux d'identification (étapes 9, 10 et 17 de architecture.md) : empreintes serveur,
 * cache, puis `onMiss` seulement si aucune entrée ne correspond. U11 placera la réservation de quota
 * et l'appel IA dans `onMiss` ; un succès du cache ne décompte rien (RG6).
 */
export async function withResultCache<T extends CacheableResult>(
  db: Database,
  images: readonly Buffer[],
  onMiss: (lookup: CacheLookup) => Promise<T>,
): Promise<CacheOutcome<T>> {
  const lookup = await prepareCacheLookup(images);

  const cached = await withQueryTimeout(db, (tx) => findCachedResult(tx, lookup));
  if (cached) {
    await bestEffort("record_hit", () => withQueryTimeout(db, (tx) => recordCacheHit(tx, cached.cacheId)));
    return { source: "cache", result: cached };
  }

  // Deux envois simultanés du même extrait, avant sa mise en cache, appellent tous deux onMiss :
  // surcoût IA rare et borné par le plafond de dépense (U14) ; l'écriture reste unique (onConflictDoNothing).
  const result = await onMiss(lookup);
  // onMiss (IA) s'exécute hors transaction : aucune connexion n'est gardée ouverte pendant l'appel externe.
  const cacheId =
    (await bestEffort("store", () => withQueryTimeout(db, (tx) => storeCachedResult(tx, lookup, result)))) ?? null;
  return { source: "ai", result, cacheId };
}

/**
 * Le cache est un bonus : une panne d'écriture ne doit pas faire échouer une identification déjà obtenue
 * (l'IA a répondu et coûté, RG3 / RG16). L'échec est signalé sans détail (invariant 9).
 */
async function bestEffort<T>(step: "record_hit" | "store", write: () => Promise<T>): Promise<T | undefined> {
  try {
    return await write();
  } catch {
    log.warn("result_cache.write_failed", { step });
    return undefined;
  }
}

function toCachedResult(row: typeof resultCache.$inferSelect): CachedResult {
  return {
    cacheId: row.id,
    tmdbId: row.tmdbId,
    mediaType: row.mediaType,
    confidence: row.confidence,
    alternatives: row.alternatives,
    validated: row.validated,
  };
}
