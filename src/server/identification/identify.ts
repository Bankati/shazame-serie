import "server-only";

import { createHash } from "node:crypto";

import { type VisionAnswer, VisionError, type VisionProvider, type VisionResult } from "@/server/ai/vision-provider";
import type { CatalogProvider, MediaType } from "@/server/catalog/catalog-provider";
import { matchProposedTitle } from "@/server/catalog/match-title";
import type { ProposedTitle } from "@/server/catalog/matching";
import type { StoredAlternative } from "@/server/db/schema";
import { hasClues, type MetadataResult } from "@/server/links/link-metadata";
import { log } from "@/server/log";
import type { QuotaIdentity, QuotaService, QuotaStatus } from "@/server/quota/quota";
import type { FrameMode, IdentifiedTitle, IdentifyResponse, QuotaInfo } from "@/schemas/identify";
import type { LinkPlatform, ParsedLink } from "@/shared/links/parse-link";

import type { IdentificationRecord } from "./persist";
import type { CacheableResult, CachedResult, CacheLookup } from "./result-cache";
import { decide, scoreIdentification, type ScoredTitle } from "./scoring";

// Flux d'identification (architecture.md, étapes 8 à 19) : quota → empreintes → cache → réservation → IA
// → rapprochement TMDB → score → confirmation ou libération → journal → cache. La limitation de débit et la
// validation des images (étapes 6 et 7) sont faites avant, par la route.

export type IdentifyDeps = {
  quota: QuotaService;
  vision: VisionProvider;
  catalog: CatalogProvider;
  prepareLookup: (images: readonly Buffer[]) => Promise<CacheLookup>;
  cache: {
    find(lookup: CacheLookup): Promise<CachedResult | null>;
    recordHit(cacheId: string): Promise<void>;
    store(lookup: CacheLookup, result: CacheableResult): Promise<void>;
  };
  /** Renvoie l'identifiant enregistré, ou null si l'écriture a échoué. */
  persist(record: IdentificationRecord): Promise<string | null>;
};

export type IdentifyOutcome =
  | { ok: true; response: IdentifyResponse }
  | { ok: false; code: "QUOTA_EXCEEDED"; quota: QuotaInfo }
  | { ok: false; code: "AI_PAUSED" }
  /** Lien (U36) : publication introuvable, ou sans indice exploitable ; jamais décompté. */
  | { ok: false; code: "LINK_NOT_FOUND" }
  | { ok: false; code: "LINK_NO_CLUES" }
  | { ok: false; code: "UPSTREAM_ERROR" };

export async function identifyClip(
  deps: IdentifyDeps,
  input: { identity: QuotaIdentity; images: readonly Buffer[]; mode?: FrameMode },
): Promise<IdentifyOutcome> {
  const { identity, images, mode = "clip" } = input;

  // 8. Quota vérifié avant le cache (AD-13) : paywall prévisible, même pour un extrait déjà connu.
  const before = await deps.quota.status(identity);
  if (before.remaining <= 0) {
    return { ok: false, code: "QUOTA_EXCEEDED", quota: toQuotaInfo(before) };
  }

  // 9-10. Empreintes calculées par le serveur, puis cache (RG6 : jamais décompté).
  const lookup = await deps.prepareLookup(images);
  const cached = await deps.cache.find(lookup);
  if (cached) {
    const fromCache = await answerFromCache(deps, identity, mode, lookup, cached, before);
    if (fromCache) {
      return fromCache;
    }
  }

  return analyzeWithAi(deps, {
    identity,
    inputKind: mode,
    fingerprint: lookup.fingerprint,
    callAi: () => deps.vision.identify(images, { mode }),
    // 17. Mise en cache (le seuil de confiance est appliqué par le cache lui-même).
    onShown: (result) => deps.cache.store(lookup, result),
  });
}

/**
 * Identification par description (U35, AD-43) : même quota, même décompte et même enregistrement que les images,
 * sans cache (deux descriptions sont presque toujours différentes). Le texte n'est ni journalisé ni enregistré :
 * seule son empreinte, calculée ici, est conservée (invariant 9).
 */
export async function identifyDescription(
  deps: Pick<IdentifyDeps, "quota" | "vision" | "catalog" | "persist">,
  input: { identity: QuotaIdentity; text: string },
): Promise<IdentifyOutcome> {
  const { identity, text } = input;
  const before = await deps.quota.status(identity);
  if (before.remaining <= 0) {
    return { ok: false, code: "QUOTA_EXCEEDED", quota: toQuotaInfo(before) };
  }
  return analyzeWithAi(deps, {
    identity,
    inputKind: "description",
    fingerprint: descriptionFingerprint(text),
    callAi: () => deps.vision.identifyFromText(text),
  });
}

/** Sources des indices d'un lien (U36) : injectées pour les tests (aucun appel réseau réel). */
export type LinkSources = {
  resolveShort(shortUrl: string): Promise<{ videoId: string; canonicalUrl: string } | null>;
  metadata(platform: LinkPlatform, videoId: string, canonicalUrl: string): Promise<MetadataResult>;
  thumbnail(url: string | null, platform: LinkPlatform): Promise<Buffer | null>;
};

/**
 * Identification par lien (U36, AD-44) : quota d'abord (AD-13), puis cache par vidéo (le même lien ne coûte ni
 * identification ni appel IA, RG6), métadonnées publiques et vignette, et l'étape d'analyse commune. Une
 * publication introuvable ou sans indice n'est jamais décomptée.
 */
export async function identifyLink(
  deps: Pick<IdentifyDeps, "quota" | "vision" | "catalog" | "persist" | "cache">,
  sources: LinkSources,
  input: { identity: QuotaIdentity; link: Extract<ParsedLink, { ok: true }> },
): Promise<IdentifyOutcome> {
  const { identity, link } = input;
  const before = await deps.quota.status(identity);
  if (before.remaining <= 0) {
    return { ok: false, code: "QUOTA_EXCEEDED", quota: toQuotaInfo(before) };
  }

  const video = "videoId" in link ? { videoId: link.videoId, canonicalUrl: link.canonicalUrl } : await sources.resolveShort(link.shortUrl);
  if (!video) {
    return { ok: false, code: "LINK_NOT_FOUND" };
  }

  // Empreinte calculée par le serveur à partir de l'identifiant extrait (invariant 4) ; aucune image.
  const lookup: CacheLookup = { frameHashes: [], fingerprint: `link:${link.platform}:${video.videoId}` };
  const cached = await deps.cache.find(lookup);
  if (cached) {
    const fromCache = await answerFromCache(deps, identity, "link", lookup, cached, before);
    if (fromCache) {
      return fromCache;
    }
  }

  const metadata = await sources.metadata(link.platform, video.videoId, video.canonicalUrl);
  if (!metadata.ok) {
    log.warn("link.metadata_failed", { platform: link.platform, failure: metadata.failure });
    return { ok: false, code: metadata.failure === "not_found" ? "LINK_NOT_FOUND" : "UPSTREAM_ERROR" };
  }
  const thumbnail = await sources.thumbnail(metadata.metadata.thumbnailUrl, link.platform);
  if (!hasClues(metadata.metadata, thumbnail)) {
    return { ok: false, code: "LINK_NO_CLUES" };
  }

  const { title, description, author, tags } = metadata.metadata;
  return analyzeWithAi(deps, {
    identity,
    inputKind: "link",
    fingerprint: lookup.fingerprint,
    callAi: () => deps.vision.identifyFromLink({ platform: link.platform, title, description, author, tags, thumbnail }),
    onShown: (result) => deps.cache.store(lookup, result),
  });
}

/** Empreinte d'une description : SHA-256 du texte normalisé (casse, accents, espaces), préfixée pour la distinguer. */
export function descriptionFingerprint(text: string): string {
  const normalized = text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();
  return `description:${createHash("sha256").update(normalized).digest("hex")}`;
}

type AnalysisInput = {
  identity: QuotaIdentity;
  inputKind: IdentificationRecord["inputKind"];
  fingerprint: string;
  callAi: () => Promise<VisionResult>;
  onShown?: (result: CacheableResult) => Promise<void>;
};

/** Étapes 12 à 18, communes à tous les modes : réservation, IA, TMDB, score, décompte ou libération, journal. */
async function analyzeWithAi(
  deps: Pick<IdentifyDeps, "quota" | "catalog" | "persist">,
  { identity, inputKind, fingerprint, callAi, onShown }: AnalysisInput,
): Promise<IdentifyOutcome> {
  // 12. Réservation atomique : deux requêtes simultanées ne dépassent jamais la limite.
  const reserved = await deps.quota.reserve(identity);
  if (!reserved.ok) {
    return { ok: false, code: "QUOTA_EXCEEDED", quota: toQuotaInfo(reserved.status) };
  }
  const { reservation } = reserved;

  let vision: VisionResult | undefined;
  try {
    // 13-14. IA (3 tentatives, RG16), rapprochement TMDB de chaque candidat, score combiné.
    vision = await callAi();
    const candidates = proposedCandidates(vision.answer);
    const matches = await Promise.all(candidates.map((candidate) => matchProposedTitle(deps.catalog, candidate.proposed)));
    const score = scoreIdentification(candidates.map((candidate, index) => ({ aiConfidence: candidate.confidence, match: matches[index]! })));

    // 15. Décompte seulement si un résultat ≥ 50 % issu de l'IA est affiché (RG3, invariant 3).
    if (score.main) {
      reservation.commit();
    } else {
      await reservation.release();
    }

    const identificationId = await deps.persist({
      identity,
      inputKind,
      fingerprint,
      source: "ai",
      outcome: score.main ? "shown" : "low_confidence",
      counted: reservation.state === "committed",
      main: score.main ? pick(score.main) : null,
      alternatives: score.alternatives.map(pick),
      promptVersion: vision.promptVersion,
      provider: vision.provider,
      model: vision.model,
      costMicroEur: vision.costMicroEur,
      latencyMs: vision.latencyMs,
    });

    if (score.main && onShown) {
      await onShown({ ...pick(score.main), alternatives: score.alternatives.map(pick) });
    }

    return {
      ok: true,
      response: {
        decision: score.decision,
        source: "ai",
        main: score.main ? toIdentifiedTitle(score.main) : null,
        alternatives: score.alternatives.map(toIdentifiedTitle),
        quota: toQuotaInfo(await deps.quota.status(identity)),
        identificationId,
      },
    };
  } catch (error) {
    // Échec IA ou TMDB, ou plafond de dépense atteint : non décompté (RG5, RG16).
    await reservation.release();
    if (error instanceof VisionError && error.reason === "paused") {
      return { ok: false, code: "AI_PAUSED" };
    }
    await deps.persist({
      identity,
      inputKind,
      fingerprint,
      source: "ai",
      outcome: "failed",
      counted: false,
      main: null,
      alternatives: [],
      promptVersion: vision?.promptVersion ?? null,
      provider: vision?.provider ?? null,
      model: vision?.model ?? null,
      costMicroEur: vision?.costMicroEur ?? 0,
      latencyMs: vision?.latencyMs ?? null,
    }).catch(() => undefined);
    return { ok: false, code: "UPSTREAM_ERROR" };
  } finally {
    // Garde-fou : aucune réservation ne reste en suspens, quel que soit le chemin.
    await reservation.release();
  }
}

/** Réponse depuis le cache, ou null si l'entrée ne peut plus être affichée (fiche TMDB disparue). */
async function answerFromCache(
  deps: Pick<IdentifyDeps, "catalog" | "cache" | "persist">,
  identity: QuotaIdentity,
  mode: IdentificationRecord["inputKind"],
  lookup: CacheLookup,
  cached: CachedResult,
  quota: QuotaStatus,
): Promise<IdentifyOutcome | null> {
  let titles: (IdentifiedTitle | null)[];
  try {
    titles = await Promise.all(
      [{ tmdbId: cached.tmdbId, mediaType: cached.mediaType, confidence: cached.confidence }, ...cached.alternatives].map(
        async (entry) => {
          const details = await deps.catalog.getTitleDetails(entry.tmdbId, entry.mediaType);
          return details
            ? { tmdbId: details.tmdbId, mediaType: details.mediaType, title: details.title, year: details.year, posterPath: details.posterPath, confidence: entry.confidence }
            : null;
        },
      ),
    );
  } catch {
    return { ok: false, code: "UPSTREAM_ERROR" };
  }

  const [main, ...alternatives] = titles;
  if (!main) {
    return null;
  }
  const decision = decide(main.confidence);
  await deps.cache.recordHit(cached.cacheId);
  const identificationId = await deps.persist({
    identity,
    inputKind: mode,
    fingerprint: lookup.fingerprint,
    source: "cache",
    outcome: decision === "ask_another_clip" ? "low_confidence" : "shown",
    counted: false,
    main: { tmdbId: main.tmdbId, mediaType: main.mediaType, confidence: main.confidence },
    alternatives: cached.alternatives,
    promptVersion: null,
    provider: null,
    model: null,
    costMicroEur: 0,
    latencyMs: null,
  });
  const known = alternatives.filter((title): title is IdentifiedTitle => title !== null);
  return {
    ok: true,
    response:
      decision === "ask_another_clip"
        ? { decision, source: "cache", main: null, alternatives: [main, ...known], quota: toQuotaInfo(quota), identificationId }
        : { decision, source: "cache", main, alternatives: known, quota: toQuotaInfo(quota), identificationId },
  };
}

type Candidate = { proposed: ProposedTitle; confidence: number };

/** Réponse principale (si reconnue) puis alternatives de l'IA, au format attendu par le rapprochement TMDB. */
function proposedCandidates(answer: VisionAnswer): Candidate[] {
  const main: Candidate[] = answer.recognized
    ? [{ proposed: { title: answer.title, originalTitle: answer.originalTitle, year: answer.year, kind: answer.kind }, confidence: answer.confidence }]
    : [];
  return [
    ...main,
    ...answer.alternatives.map((alternative) => ({
      proposed: { title: alternative.title, originalTitle: alternative.originalTitle, year: alternative.year, kind: alternative.kind },
      confidence: alternative.confidence,
    })),
  ];
}

function pick(title: ScoredTitle): StoredAlternative & { mediaType: MediaType } {
  return { tmdbId: title.tmdbId, mediaType: title.mediaType, confidence: title.confidence };
}

function toIdentifiedTitle(title: ScoredTitle): IdentifiedTitle {
  return { tmdbId: title.tmdbId, mediaType: title.mediaType, title: title.title, year: title.year, posterPath: title.posterPath, confidence: title.confidence };
}

export function toQuotaInfo(status: QuotaStatus): QuotaInfo {
  return { plan: status.plan, limit: status.limit, remaining: status.remaining, resetAt: status.resetAt.toISOString() };
}

