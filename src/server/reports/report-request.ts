import "server-only";

import { cookies } from "next/headers";

import { reportFieldsSchema } from "@/schemas/report";
import { type Account, getCurrentAccount, requireAdmin } from "@/server/auth/guards";
import { VISITOR_COOKIE, verifyVisitorCookie } from "@/server/auth/visitor";
import { getDb } from "@/server/db/client";
import { type AttemptLimiter, buildLimiter } from "@/server/http/attempt-limiter";
import { clientIp } from "@/server/http/rate-limit";
import { jsonError, jsonOk } from "@/server/http/respond";
import { isSameOrigin } from "@/server/http/same-origin";
import { validateFrames } from "@/server/identification/validate-frames";
import { log } from "@/server/log";
import { getStorageAdmin } from "@/server/storage/admin-client";
import { MIN_USABLE_IMAGES } from "@/shared/frames/constants";

import {
  attachReportImages,
  createReport,
  findOwnIdentification,
  type NewReport,
  REPORT_IMAGE_URL_TTL_S,
  type ReportedIdentification,
  reportImagePaths,
  type ReportImageStore,
  type ReportOwner,
  supabaseReportImageStore,
} from "./reports";

// POST /api/reports (U20). Ordre fixe : origine, limitation de débit, validation (champs puis images),
// identité (compte ou visiteur), propriété de l'identification, puis écriture. Ouvert aux visiteurs.
const NO_STORE = { "Cache-Control": "private, no-store" };
export const REPORTS_PER_HOUR = 10;

export type ReportDeps = {
  limiter: AttemptLimiter;
  account: () => Promise<Account | null>;
  visitorKey: () => Promise<string | null>;
  findIdentification: (identificationId: string, owner: ReportOwner) => Promise<ReportedIdentification | null>;
  create: (report: NewReport) => Promise<{ reportId: string; created: boolean }>;
  store: () => ReportImageStore | null;
  attachImages: (reportId: string, paths: string[]) => Promise<void>;
};

let limiter: AttemptLimiter | undefined;

export function reportDeps(): ReportDeps {
  limiter ??= buildLimiter("reports", REPORTS_PER_HOUR);
  return {
    limiter,
    account: getCurrentAccount,
    visitorKey: async () => verifyVisitorCookie((await cookies()).get(VISITOR_COOKIE)?.value),
    findIdentification: (identificationId, owner) => findOwnIdentification(getDb(), identificationId, owner),
    create: (report) => createReport(getDb(), report),
    store: () => {
      const client = getStorageAdmin();
      return client ? supabaseReportImageStore(client) : null;
    },
    attachImages: (reportId, paths) => attachReportImages(getDb(), reportId, paths),
  };
}

export async function handleReportPost(request: Request, deps: ReportDeps = reportDeps()): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("FORBIDDEN", undefined, { headers: NO_STORE });
  }
  const rate = await deps.limiter.consume(`report:${clientIp(request.headers)}`);
  if (!rate.ok) {
    return jsonError("RATE_LIMITED", undefined, { headers: NO_STORE });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }
  const fields = reportFieldsSchema.safeParse({
    identificationId: form.get("identificationId") ?? undefined,
    correctedTmdbId: form.get("correctedTmdbId") || undefined,
    correctedMediaType: form.get("correctedMediaType") || undefined,
    imagesConsent: form.get("imagesConsent") ?? undefined,
  });
  if (!fields.success) {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }
  const consent = fields.data.imagesConsent === "true";
  const sentFrames = form.getAll("frames");
  // RG8 : sans consentement, aucune image n'est acceptée, même si le navigateur en envoie.
  if (!consent && sentFrames.length > 0) {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }
  // Mêmes contrôles que l'identification (invariant 1) : 1 à 5 images JPEG (une capture seule en mode image,
  // U34), 1,5 Mo au plus, type réel.
  const frames = consent && sentFrames.length > 0 ? await validateFrames(sentFrames, { minCount: MIN_USABLE_IMAGES }) : null;
  if (frames && !frames.ok) {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }

  const account = await deps.account();
  const visitorKey = account ? null : await deps.visitorKey();
  const owner: ReportOwner | null = account ? { userId: account.id } : visitorKey ? { visitorKey } : null;
  if (!owner) {
    return jsonError("NOT_FOUND", undefined, { headers: NO_STORE });
  }
  const identification = await deps.findIdentification(fields.data.identificationId, owner);
  if (!identification) {
    return jsonError("NOT_FOUND", undefined, { headers: NO_STORE });
  }

  try {
    const corrected =
      fields.data.correctedTmdbId !== undefined && fields.data.correctedMediaType !== undefined
        ? { tmdbId: fields.data.correctedTmdbId, mediaType: fields.data.correctedMediaType }
        : null;
    const { reportId, created } = await deps.create({ identification, userId: account?.id ?? null, corrected, imagesConsent: consent });
    let imagesStored = 0;
    if (created && frames?.ok) {
      imagesStored = await storeImages(deps, reportId, frames.images);
    }
    log.info("report.created", { created, images: imagesStored, corrected: corrected !== null });
    return jsonOk({ reportId, imagesStored }, { status: created ? 201 : 200, headers: NO_STORE });
  } catch {
    log.error("report.create_failed");
    return jsonError("INTERNAL_ERROR", undefined, { headers: NO_STORE });
  }
}

// Images rangées sous le dossier du signalement. Une panne de stockage n'annule pas le signalement :
// il reste utile sans images (proposition et correction).
async function storeImages(deps: ReportDeps, reportId: string, images: readonly Buffer[]): Promise<number> {
  const store = deps.store();
  if (!store) {
    log.warn("report.storage_not_configured");
    return 0;
  }
  const paths: string[] = [];
  try {
    for (const [index, image] of images.entries()) {
      const path = `${reportId}/${index + 1}.jpg`;
      await store.upload(path, image);
      paths.push(path);
    }
  } catch {
    log.warn("report.images_upload_failed", { stored: paths.length });
  }
  if (paths.length > 0) {
    await deps.attachImages(reportId, paths);
  }
  return paths.length;
}

/** GET /api/admin/reports/{id}/images : liens signés (15 min), réservés à l'administration. */
export async function handleReportImages(
  reportId: string,
  deps: { access: typeof requireAdmin; paths: (id: string) => Promise<string[] | null>; store: () => ReportImageStore | null } = {
    access: requireAdmin,
    paths: (id) => reportImagePaths(getDb(), id),
    store: () => {
      const client = getStorageAdmin();
      return client ? supabaseReportImageStore(client) : null;
    },
  },
): Promise<Response> {
  const access = await deps.access();
  if (!access.ok) {
    return jsonError(access.code, undefined, { headers: NO_STORE });
  }
  if (!/^[0-9a-f-]{36}$/i.test(reportId)) {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }
  const paths = await deps.paths(reportId);
  if (paths === null) {
    return jsonError("NOT_FOUND", undefined, { headers: NO_STORE });
  }
  const store = deps.store();
  const urls = store ? await Promise.all(paths.map((path) => store.signedUrl(path, REPORT_IMAGE_URL_TTL_S))) : [];
  return jsonOk({ images: urls.filter((url): url is string => url !== null) }, { headers: NO_STORE });
}
