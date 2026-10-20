import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "@/server/db/client";
import {
  attachReportImages,
  createReport,
  findOwnIdentification,
  REPORTS_BUCKET,
  supabaseReportImageStore,
} from "@/server/reports/reports";

import { adminSql, publicClient, secretClient } from "./helpers";

// Critère de fin de U20 : sans consentement, aucune image stockée ; avec consentement, images lisibles
// seulement par le serveur (liens signés de l'administration), jamais avec la clé publique.
const sql = adminSql();
const db = getDb();
const admin = secretClient();
const store = supabaseReportImageStore(admin);
const PREFIX = `test-report-${Date.now()}`;
const VISITOR = `${PREFIX}-visiteur`;
const reportIds: string[] = [];

async function identification(label: string): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    insert into public.identifications (visitor_key, fingerprint, tmdb_id, media_type, confidence, source, outcome)
    values (${VISITOR}, ${`${PREFIX}-${label}`}, 603, 'movie', 91, 'cache', 'shown') returning id`;
  if (!row) throw new Error("identification non créée");
  return row.id;
}

async function cacheEntry(label: string): Promise<void> {
  await sql`insert into public.result_cache (fingerprint, tmdb_id, media_type, confidence) values (${`${PREFIX}-${label}`}, 603, 'movie', 91)`;
}

async function objectsOf(reportId: string): Promise<string[]> {
  const { data } = await admin.storage.from(REPORTS_BUCKET).list(reportId);
  return (data ?? []).map((item) => `${reportId}/${item.name}`);
}

let jpeg: Buffer;

beforeAll(async () => {
  jpeg = await sharp({ create: { width: 64, height: 36, channels: 3, background: "#224488" } }).jpeg().toBuffer();
});

afterAll(async () => {
  for (const id of reportIds) {
    const paths = await objectsOf(id);
    if (paths.length > 0) await admin.storage.from(REPORTS_BUCKET).remove(paths);
  }
  await sql`delete from public.reports where id = any(${reportIds}::uuid[])`;
  await sql`delete from public.identifications where fingerprint like ${`${PREFIX}-%`}`;
  await sql`delete from public.result_cache where fingerprint like ${`${PREFIX}-%`}`;
  await sql.end();
});

describe("signalement", () => {
  it("ne vise que les identifications de la personne qui signale", async () => {
    const id = await identification("a");
    expect(await findOwnIdentification(db, id, { visitorKey: VISITOR })).toMatchObject({ id, tmdbId: 603, mediaType: "movie" });
    expect(await findOwnIdentification(db, id, { visitorKey: "un-autre-visiteur" })).toBeNull();
    expect(await findOwnIdentification(db, id, { userId: "8b1f3c1e-0000-4000-8000-000000000099" })).toBeNull();
  });

  it("désactive l'entrée de cache de l'extrait ; un second signalement renvoie le premier", async () => {
    const id = await identification("b");
    await cacheEntry("b");
    const found = await findOwnIdentification(db, id, { visitorKey: VISITOR });
    if (!found) throw new Error("identification introuvable");
    const first = await createReport(db, { identification: found, userId: null, corrected: { tmdbId: 604, mediaType: "movie" }, imagesConsent: false });
    reportIds.push(first.reportId);
    expect(first.created).toBe(true);
    const [entry] = await sql<{ disabled: boolean }[]>`select disabled from public.result_cache where fingerprint = ${`${PREFIX}-b`}`;
    expect(entry?.disabled).toBe(true);
    const [row] = await sql`select proposed_tmdb_id, corrected_tmdb_id, images_consent from public.reports where id = ${first.reportId}`;
    expect(row).toEqual({ proposed_tmdb_id: 603, corrected_tmdb_id: 604, images_consent: false });
    expect(await createReport(db, { identification: found, userId: null, corrected: null, imagesConsent: true })).toEqual({ reportId: first.reportId, created: false });
  });

  it("sans consentement : aucune image n'est rattachée, même si on essaie (critère de fin)", async () => {
    const id = await identification("c");
    const found = await findOwnIdentification(db, id, { visitorKey: VISITOR });
    if (!found) throw new Error("identification introuvable");
    const { reportId } = await createReport(db, { identification: found, userId: null, corrected: null, imagesConsent: false });
    reportIds.push(reportId);
    await attachReportImages(db, reportId, [`${reportId}/1.jpg`]);
    const [row] = await sql<{ storage_paths: string[] }[]>`select storage_paths from public.reports where id = ${reportId}`;
    expect(row?.storage_paths).toEqual([]);
    expect(await objectsOf(reportId)).toEqual([]);
    // La base refuse aussi des chemins sans consentement (contrainte reports_images_require_consent).
    await expect(sql`update public.reports set storage_paths = ${[`${reportId}/1.jpg`]} where id = ${reportId}`).rejects.toThrow();
  });

  it("avec consentement : images dans le bucket privé, lisibles par lien signé, jamais avec la clé publique", async () => {
    const id = await identification("d");
    const found = await findOwnIdentification(db, id, { visitorKey: VISITOR });
    if (!found) throw new Error("identification introuvable");
    const { reportId } = await createReport(db, { identification: found, userId: null, corrected: null, imagesConsent: true });
    reportIds.push(reportId);
    const path = `${reportId}/1.jpg`;
    await store.upload(path, jpeg);
    await attachReportImages(db, reportId, [path]);
    expect(await objectsOf(reportId)).toEqual([path]);
    expect(await store.signedUrl(path, 60)).toMatch(/^http/);
    const download = await publicClient().storage.from(REPORTS_BUCKET).download(path);
    expect(download.error).not.toBeNull();
  });
});
