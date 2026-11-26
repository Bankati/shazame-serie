import "server-only";

import { desc, eq, sql } from "drizzle-orm";

import type { Result } from "@/schemas/errors";
import { lookupTitleDetails } from "@/server/catalog/title-lookup";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import { type Database, withQueryTimeout } from "@/server/db/client";
import { identifications, reports, resultCache } from "@/server/db/schema";

import { type AuditEntry, withAdminAudit } from "./audit";
import {
  decideCacheCorrection,
  decideReview,
  type ReportStatus,
  type ReviewRefusal,
  type TitleRef,
} from "./report-review-rules";

// Revue des signalements par l'admin (U26b, CDC 12.9). L'appelant a vérifié le rôle admin.

export const REPORTS_PAGE_SIZE = 50;
export const REPORT_STATUSES = ["open", "reviewed", "added_to_eval", "rejected"] as const satisfies readonly ReportStatus[];

const titleOf = (tmdbId: number | null, mediaType: "movie" | "tv" | null): TitleRef | null =>
  tmdbId !== null && mediaType !== null ? { tmdbId, mediaType } : null;

export type AdminReportRow = {
  id: string;
  status: ReportStatus;
  createdAt: Date;
  proposed: TitleRef | null;
  suggested: TitleRef | null;
  imageCount: number;
  fromAccount: boolean;
};

/** Signalements d'un statut, du plus récent au plus ancien ; `page` commence à 1. */
export async function listReports(
  db: Database,
  status: ReportStatus,
  page: number,
): Promise<{ rows: AdminReportRow[]; hasNext: boolean }> {
  const offset = (Math.max(1, Math.trunc(page)) - 1) * REPORTS_PAGE_SIZE;
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({
        id: reports.id,
        status: reports.status,
        createdAt: reports.createdAt,
        proposedTmdbId: reports.proposedTmdbId,
        proposedMediaType: reports.proposedMediaType,
        correctedTmdbId: reports.correctedTmdbId,
        correctedMediaType: reports.correctedMediaType,
        imageCount: sql<number>`cardinality(${reports.storagePaths})`.mapWith(Number),
        userId: reports.userId,
      })
      .from(reports)
      .where(eq(reports.status, status))
      .orderBy(desc(reports.createdAt), desc(reports.id))
      .limit(REPORTS_PAGE_SIZE + 1)
      .offset(offset),
  );
  return {
    rows: rows.slice(0, REPORTS_PAGE_SIZE).map((row) => ({
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      proposed: titleOf(row.proposedTmdbId, row.proposedMediaType),
      suggested: titleOf(row.correctedTmdbId, row.correctedMediaType),
      imageCount: row.imageCount,
      fromAccount: row.userId !== null,
    })),
    hasNext: rows.length > REPORTS_PAGE_SIZE,
  };
}

export type AdminReportDetail = AdminReportRow & {
  storagePaths: string[];
  identifiedAt: Date | null;
  proposedConfidence: number | null;
  /** Entrée de cache de l'extrait (même empreinte), ou null si aucune. */
  cache: (TitleRef & { confidence: number; disabled: boolean; validated: boolean }) | null;
};

export async function loadReport(db: Database, reportId: string): Promise<AdminReportDetail | null> {
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({
        id: reports.id,
        status: reports.status,
        createdAt: reports.createdAt,
        proposedTmdbId: reports.proposedTmdbId,
        proposedMediaType: reports.proposedMediaType,
        correctedTmdbId: reports.correctedTmdbId,
        correctedMediaType: reports.correctedMediaType,
        storagePaths: reports.storagePaths,
        userId: reports.userId,
        identifiedAt: identifications.createdAt,
        proposedConfidence: identifications.confidence,
        cacheTmdbId: resultCache.tmdbId,
        cacheMediaType: resultCache.mediaType,
        cacheConfidence: resultCache.confidence,
        cacheDisabled: resultCache.disabled,
        cacheValidated: resultCache.validated,
      })
      .from(reports)
      .leftJoin(identifications, eq(identifications.id, reports.identificationId))
      .leftJoin(resultCache, eq(resultCache.fingerprint, identifications.fingerprint))
      .where(eq(reports.id, reportId))
      .limit(1),
  );
  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    createdAt: row.createdAt,
    proposed: titleOf(row.proposedTmdbId, row.proposedMediaType),
    suggested: titleOf(row.correctedTmdbId, row.correctedMediaType),
    imageCount: row.storagePaths.length,
    fromAccount: row.userId !== null,
    storagePaths: row.storagePaths,
    identifiedAt: row.identifiedAt,
    proposedConfidence: row.proposedConfidence,
    cache:
      row.cacheTmdbId !== null && row.cacheMediaType !== null
        ? {
            tmdbId: row.cacheTmdbId,
            mediaType: row.cacheMediaType,
            confidence: row.cacheConfidence ?? 0,
            disabled: row.cacheDisabled ?? false,
            validated: row.cacheValidated ?? false,
          }
        : null,
  };
}

export type ReviewOutcome = { status: Exclude<ReportStatus, "open">; cacheCorrected: boolean };

/**
 * Décision de l'admin sur un signalement ouvert : titre retenu écrit dans le signalement, entrée de cache de
 * l'extrait corrigée, réactivée et validée. Le tout et le journal dans la même transaction (invariant 6).
 * Le titre retenu a été vérifié dans le catalogue par l'appelant.
 */
export async function reviewReport(
  db: Database,
  adminId: string,
  reportId: string,
  retained: TitleRef,
  addToEval: boolean,
): Promise<Result<ReviewOutcome, ReviewRefusal>> {
  return withAdminAudit<Result<ReviewOutcome, ReviewRefusal>>(db, adminId, async (tx) => {
    // Ligne verrouillée : deux admins simultanés ne revoient pas deux fois le même signalement.
    const [report] = await tx
      .select({
        status: reports.status,
        proposedTmdbId: reports.proposedTmdbId,
        proposedMediaType: reports.proposedMediaType,
        correctedTmdbId: reports.correctedTmdbId,
        correctedMediaType: reports.correctedMediaType,
        imageCount: sql<number>`cardinality(${reports.storagePaths})`.mapWith(Number),
        identificationId: reports.identificationId,
      })
      .from(reports)
      .where(eq(reports.id, reportId))
      .for("update");
    const decision = decideReview(
      report
        ? { status: report.status, proposed: titleOf(report.proposedTmdbId, report.proposedMediaType), hasImages: report.imageCount > 0 }
        : null,
      retained,
      addToEval,
    );
    if (decision.kind === "refused" || !report) {
      return { result: { ok: false, error: decision.kind === "refused" ? decision.reason : "not_found" }, audit: null };
    }

    await tx
      .update(reports)
      .set({ status: decision.status, correctedTmdbId: retained.tmdbId, correctedMediaType: retained.mediaType })
      .where(eq(reports.id, reportId));
    const audit: AuditEntry[] = [
      {
        action: "report.review",
        targetType: "report",
        targetId: reportId,
        before: { status: report.status, tmdbId: report.correctedTmdbId, mediaType: report.correctedMediaType },
        after: { status: decision.status, tmdbId: retained.tmdbId, mediaType: retained.mediaType },
      },
    ];

    // Entrée de cache de l'extrait signalé (identification encore présente : non purgée).
    const entry = report.identificationId
      ? (
          await tx
            .select({
              id: resultCache.id,
              tmdbId: resultCache.tmdbId,
              mediaType: resultCache.mediaType,
              confidence: resultCache.confidence,
              disabled: resultCache.disabled,
              validated: resultCache.validated,
            })
            .from(resultCache)
            .innerJoin(identifications, eq(identifications.fingerprint, resultCache.fingerprint))
            .where(eq(identifications.id, report.identificationId))
            .for("update", { of: resultCache })
        )[0]
      : undefined;
    const correction = entry ? decideCacheCorrection(entry, retained) : null;
    if (entry && correction) {
      await tx
        .update(resultCache)
        .set({
          tmdbId: correction.tmdbId,
          mediaType: correction.mediaType,
          confidence: correction.confidence,
          validated: true,
          disabled: false,
          ...(correction.clearAlternatives ? { alternatives: [] } : {}),
        })
        .where(eq(resultCache.id, entry.id));
      audit.push({
        action: "cache.correct",
        targetType: "result_cache",
        targetId: entry.id,
        before: { tmdbId: entry.tmdbId, mediaType: entry.mediaType, confidence: entry.confidence, disabled: entry.disabled, validated: entry.validated },
        after: { tmdbId: correction.tmdbId, mediaType: correction.mediaType, confidence: correction.confidence, disabled: false, validated: true },
      });
    }
    return { result: { ok: true, value: { status: decision.status, cacheCorrected: correction !== null } }, audit };
  });
}

const titleKey = (title: TitleRef) => `${title.mediaType}:${title.tmdbId}`;

/**
 * Libellés « Titre (année) » des titres cités, relus au catalogue (jamais copiés en base). Clé `type:id` ;
 * absente si le catalogue est indisponible, lent ou ne connaît pas le titre (l'appelant affiche l'identifiant).
 */
export async function loadTitleLabels(titles: readonly (TitleRef | null)[]): Promise<Map<string, string>> {
  const unique = [...new Map(titles.filter((t): t is TitleRef => t !== null).map((t) => [titleKey(t), t])).values()];
  let catalog = null;
  try {
    catalog = getCatalog();
  } catch {
    // TMDB non configuré : identifiants seuls.
  }
  const details = await lookupTitleDetails(unique, catalog);
  const labels = new Map<string, string>();
  unique.forEach((title, index) => {
    const found = details[index];
    if (found) labels.set(titleKey(title), found.year ? `${found.title} (${found.year})` : found.title);
  });
  return labels;
}

export const labelOf = (labels: Map<string, string>, title: TitleRef): string | undefined => labels.get(titleKey(title));
