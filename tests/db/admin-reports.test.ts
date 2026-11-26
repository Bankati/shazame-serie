import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { listReports, loadReport, reviewReport } from "@/server/admin/reports-admin";
import { ensureAccount } from "@/server/auth/profile";
import { getDb } from "@/server/db/client";

import { adminSql, secretClient } from "./helpers";

// Critère de fin de U26b : la revue d'un signalement écrit ses lignes d'audit dans la même transaction que
// le signalement et le cache (invariant 6) ; une revue refusée n'écrit rien ; un échec du journal annule tout.
const sql = adminSql();
const db = getDb();
const supabase = secretClient();
const PREFIX = `test-admin-reports-${Date.now()}`;
const VISITOR = `${PREFIX}-visiteur`;
let adminId = "";

async function reportWithCache(label: string, options: { cache?: boolean; images?: boolean } = {}): Promise<{ reportId: string; fingerprint: string }> {
  const fingerprint = `${PREFIX}-${label}`;
  const [identification] = await sql<{ id: string }[]>`
    insert into public.identifications (visitor_key, fingerprint, tmdb_id, media_type, confidence, source, outcome)
    values (${VISITOR}, ${fingerprint}, 603, 'movie', 91, 'ai', 'shown') returning id`;
  if (options.cache !== false) {
    await sql`
      insert into public.result_cache (fingerprint, tmdb_id, media_type, confidence, alternatives, disabled)
      values (${fingerprint}, 603, 'movie', 91, ${sql.json([{ tmdbId: 605, mediaType: "movie", confidence: 40 }])}, true)`;
  }
  const images = options.images ? [`${label}/image-1.jpg`] : [];
  const [report] = await sql<{ id: string }[]>`
    insert into public.reports (identification_id, proposed_tmdb_id, proposed_media_type, corrected_tmdb_id, corrected_media_type, images_consent, storage_paths)
    values (${identification?.id ?? null}, 603, 'movie', 604, 'movie', ${options.images ?? false}, ${images}) returning id`;
  if (!report) throw new Error("signalement non créé");
  return { reportId: report.id, fingerprint };
}

const auditOf = (targetIds: string[]) =>
  sql<{ action: string; target_type: string; before: unknown; after: unknown }[]>`
    select action, target_type, before, after from public.admin_audit_log where target_id = any(${targetIds}) order by action`;
const reportRow = async (id: string) =>
  (await sql<{ status: string; corrected_tmdb_id: number | null }[]>`select status, corrected_tmdb_id from public.reports where id = ${id}`)[0];
const cacheRow = async (fingerprint: string) =>
  (
    await sql<{ id: string; tmdb_id: number; confidence: number; disabled: boolean; validated: boolean; alternatives: unknown }[]>`
      select id, tmdb_id, confidence, disabled, validated, alternatives from public.result_cache where fingerprint = ${fingerprint}`
  )[0];

beforeAll(async () => {
  const { data, error } = await supabase.auth.admin.createUser({
    email: `${PREFIX}-admin@example.com`,
    password: "motdepasse-test",
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("utilisateur non créé");
  adminId = data.user.id;
  await ensureAccount(db, { userId: adminId, displayName: `${PREFIX}-admin` });
  await sql`update public.profiles set role = 'admin' where id = ${adminId}`;
});

afterAll(async () => {
  await sql`delete from public.admin_audit_log where admin_id = ${adminId}`;
  await sql`delete from public.reports where identification_id in (select id from public.identifications where fingerprint like ${`${PREFIX}-%`})`;
  await sql`delete from public.identifications where fingerprint like ${`${PREFIX}-%`}`;
  await sql`delete from public.result_cache where fingerprint like ${`${PREFIX}-%`}`;
  await supabase.auth.admin.deleteUser(adminId);
  await sql.end();
});

describe("reviewReport", () => {
  it("corrige le signalement et le cache, avec une ligne d'audit pour chacun", async () => {
    const { reportId, fingerprint } = await reportWithCache("correct");
    const outcome = await reviewReport(db, adminId, reportId, { tmdbId: 604, mediaType: "movie" }, false);
    expect(outcome).toEqual({ ok: true, value: { status: "reviewed", cacheCorrected: true } });
    expect(await reportRow(reportId)).toEqual({ status: "reviewed", corrected_tmdb_id: 604 });
    const cache = await cacheRow(fingerprint);
    expect(cache).toMatchObject({ tmdb_id: 604, confidence: 100, disabled: false, validated: true, alternatives: [] });
    const audit = await auditOf([reportId, cache?.id ?? ""]);
    expect(audit).toEqual([
      expect.objectContaining({ action: "cache.correct", target_type: "result_cache", after: expect.objectContaining({ tmdbId: 604, disabled: false }) }),
      expect.objectContaining({ action: "report.review", target_type: "report", before: expect.objectContaining({ status: "open" }) }),
    ]);
  });

  it("rejette un signalement infondé : cache réactivé avec le même titre", async () => {
    const { reportId, fingerprint } = await reportWithCache("reject");
    expect(await reviewReport(db, adminId, reportId, { tmdbId: 603, mediaType: "movie" }, false)).toMatchObject({ ok: true, value: { status: "rejected" } });
    expect(await cacheRow(fingerprint)).toMatchObject({ tmdb_id: 603, confidence: 91, disabled: false, validated: true });
  });

  it("met à jour le seul signalement quand l'extrait n'a pas d'entrée de cache", async () => {
    const { reportId } = await reportWithCache("sans-cache", { cache: false });
    expect(await reviewReport(db, adminId, reportId, { tmdbId: 604, mediaType: "movie" }, false)).toEqual({
      ok: true,
      value: { status: "reviewed", cacheCorrected: false },
    });
    expect((await auditOf([reportId])).map((row) => row.action)).toEqual(["report.review"]);
  });

  it("ajoute au jeu de test un signalement avec images, refuse sans image sans rien écrire", async () => {
    const without = await reportWithCache("eval-sans-image");
    expect(await reviewReport(db, adminId, without.reportId, { tmdbId: 604, mediaType: "movie" }, true)).toEqual({ ok: false, error: "eval_needs_images" });
    expect(await reportRow(without.reportId)).toMatchObject({ status: "open" });
    expect(await cacheRow(without.fingerprint)).toMatchObject({ disabled: true, tmdb_id: 603 });
    expect(await auditOf([without.reportId])).toHaveLength(0);

    const withImages = await reportWithCache("eval-images", { images: true });
    expect(await reviewReport(db, adminId, withImages.reportId, { tmdbId: 604, mediaType: "movie" }, true)).toMatchObject({
      ok: true,
      value: { status: "added_to_eval" },
    });
  });

  it("refuse une seconde revue et un signalement inexistant, sans journal", async () => {
    const { reportId } = await reportWithCache("deux-fois");
    await reviewReport(db, adminId, reportId, { tmdbId: 604, mediaType: "movie" }, false);
    const before = (await auditOf([reportId])).length;
    expect(await reviewReport(db, adminId, reportId, { tmdbId: 603, mediaType: "movie" }, false)).toEqual({ ok: false, error: "already_reviewed" });
    expect(await auditOf([reportId])).toHaveLength(before);
    expect(await reviewReport(db, adminId, randomUUID(), { tmdbId: 603, mediaType: "movie" }, false)).toEqual({ ok: false, error: "not_found" });
  });

  it("annule le signalement et le cache si le journal ne peut pas être écrit", async () => {
    const { reportId, fingerprint } = await reportWithCache("retour-arriere");
    // Administrateur inexistant : la clé étrangère du journal échoue, tout doit être annulé.
    await expect(reviewReport(db, randomUUID(), reportId, { tmdbId: 604, mediaType: "movie" }, false)).rejects.toThrow();
    expect(await reportRow(reportId)).toMatchObject({ status: "open", corrected_tmdb_id: 604 });
    expect(await cacheRow(fingerprint)).toMatchObject({ tmdb_id: 603, disabled: true, validated: false });
  });
});

describe("lectures", () => {
  it("liste par statut et charge le détail avec l'état du cache", async () => {
    const { reportId } = await reportWithCache("lecture", { images: true });
    const { rows } = await listReports(db, "open", 1);
    expect(rows.find((row) => row.id === reportId)).toMatchObject({
      proposed: { tmdbId: 603, mediaType: "movie" },
      suggested: { tmdbId: 604, mediaType: "movie" },
      imageCount: 1,
      fromAccount: false,
    });
    expect(await loadReport(db, reportId)).toMatchObject({
      proposedConfidence: 91,
      cache: { tmdbId: 603, mediaType: "movie", disabled: true, validated: false },
      storagePaths: ["lecture/image-1.jpg"],
    });
  });
});
