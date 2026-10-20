import "server-only";

import { and, eq } from "drizzle-orm";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { MediaType } from "@/server/catalog/catalog-provider";
import { type Database, withQueryTimeout } from "@/server/db/client";
import { identifications, reports, resultCache } from "@/server/db/schema";

// Signalement d'erreur (U20, RG7, RG8). Le signalement vise une identification de la personne qui signale
// (compte ou visiteur) : on ne peut pas désactiver le résultat d'un autre. Les images ne sont conservées
// qu'avec consentement, dans le bucket privé `reports`, lisible par l'administration seule (URL signées).

export const REPORTS_BUCKET = "reports";
export const REPORT_IMAGE_URL_TTL_S = 15 * 60;

export type ReportOwner = { userId: string } | { visitorKey: string };

export type ReportedIdentification = {
  id: string;
  fingerprint: string;
  tmdbId: number | null;
  mediaType: MediaType | null;
};

/** Identification de cette personne uniquement ; null si elle n'existe pas ou appartient à quelqu'un d'autre. */
export async function findOwnIdentification(db: Database, identificationId: string, owner: ReportOwner): Promise<ReportedIdentification | null> {
  const ownership =
    "userId" in owner ? eq(identifications.userId, owner.userId) : eq(identifications.visitorKey, owner.visitorKey);
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({
        id: identifications.id,
        fingerprint: identifications.fingerprint,
        tmdbId: identifications.tmdbId,
        mediaType: identifications.mediaType,
      })
      .from(identifications)
      .where(and(eq(identifications.id, identificationId), ownership))
      .limit(1),
  );
  return rows[0] ?? null;
}

export type NewReport = {
  identification: ReportedIdentification;
  userId: string | null;
  corrected: { tmdbId: number; mediaType: MediaType } | null;
  imagesConsent: boolean;
};

/**
 * Enregistre le signalement et désactive l'entrée de cache de cet extrait jusqu'à revue admin
 * (architecture.md), dans la même transaction. Un second signalement de la même identification renvoie
 * le premier, sans rien créer.
 */
export async function createReport(db: Database, report: NewReport): Promise<{ reportId: string; created: boolean }> {
  return withQueryTimeout(db, async (tx) => {
    const [existing] = await tx
      .select({ id: reports.id })
      .from(reports)
      .where(eq(reports.identificationId, report.identification.id))
      .limit(1);
    if (existing) {
      return { reportId: existing.id, created: false };
    }
    const [inserted] = await tx
      .insert(reports)
      .values({
        identificationId: report.identification.id,
        userId: report.userId,
        // Proposition relue dans l'identification enregistrée, jamais reprise du navigateur.
        proposedTmdbId: report.identification.tmdbId,
        proposedMediaType: report.identification.mediaType,
        correctedTmdbId: report.corrected?.tmdbId ?? null,
        correctedMediaType: report.corrected?.mediaType ?? null,
        imagesConsent: report.imagesConsent,
      })
      .returning({ id: reports.id });
    if (!inserted) throw new Error("report_insert_failed");
    await tx.update(resultCache).set({ disabled: true }).where(eq(resultCache.fingerprint, report.identification.fingerprint));
    return { reportId: inserted.id, created: true };
  });
}

/** Chemins des images enregistrées (seulement si le signalement porte le consentement : contrainte SQL). */
export async function attachReportImages(db: Database, reportId: string, paths: string[]): Promise<void> {
  await withQueryTimeout(db, (tx) =>
    tx.update(reports).set({ storagePaths: paths }).where(and(eq(reports.id, reportId), eq(reports.imagesConsent, true))),
  );
}

export async function reportImagePaths(db: Database, reportId: string): Promise<string[] | null> {
  const rows = await withQueryTimeout(db, (tx) =>
    tx.select({ paths: reports.storagePaths }).from(reports).where(eq(reports.id, reportId)).limit(1),
  );
  return rows[0]?.paths ?? null;
}

export type ReportImageStore = {
  upload(path: string, data: Buffer): Promise<void>;
  signedUrl(path: string, expiresInSeconds: number): Promise<string | null>;
};

export function supabaseReportImageStore(client: SupabaseClient): ReportImageStore {
  const bucket = client.storage.from(REPORTS_BUCKET);
  return {
    async upload(path, data) {
      const { error } = await bucket.upload(path, data, { contentType: "image/jpeg", upsert: false });
      if (error) throw new Error("report_image_upload_failed");
    },
    async signedUrl(path, expiresInSeconds) {
      const { data, error } = await bucket.createSignedUrl(path, expiresInSeconds);
      return error ? null : data.signedUrl;
    },
  };
}
