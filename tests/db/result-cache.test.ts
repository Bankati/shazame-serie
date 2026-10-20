import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { sql as drizzleSql } from "drizzle-orm";
import { getDb, withQueryTimeout } from "@/server/db/client";
import {
  type CacheableResult,
  disableCachedResult,
  findCachedResult,
  prepareCacheLookup,
  storeCachedResult,
  withResultCache,
} from "@/server/identification/result-cache";

import { clipJpegs, recompress } from "../support/scene-images";
import { adminSql } from "./helpers";

// Critère de fin de U10 (build-plan.md) sur la base locale : un seul appel « IA » pour le même extrait,
// succès malgré une recompression, aucun faux rapprochement entre deux extraits différents.
const sql = adminSql();
const db = getDb();

const MATRIX: CacheableResult = { tmdbId: 603, mediaType: "movie", confidence: 92, alternatives: [] };

beforeEach(async () => {
  await sql`delete from public.result_cache`;
});

afterAll(async () => {
  await sql`delete from public.result_cache`;
  await sql.end();
});

describe("cache de résultats", () => {
  it("n'appelle l'IA qu'une fois pour le même jeu d'images, puis répond depuis le cache", async () => {
    const images = await clipJpegs(100);
    const identify = vi.fn(async () => MATRIX);

    const first = await withResultCache(db, images, identify);
    const second = await withResultCache(db, images, identify);

    expect(identify).toHaveBeenCalledTimes(1);
    expect(first.source).toBe("ai");
    expect(second).toMatchObject({ source: "cache", result: { tmdbId: 603, mediaType: "movie", confidence: 92 } });

    const [row] = await sql<{ hits: number; frames: number }[]>`
      select hits, (select count(*)::int from public.result_cache_frames) as frames from public.result_cache`;
    expect(row).toEqual({ hits: 1, frames: 4 });
  });

  it("mode image (U34) : une capture seule déjà vue sert le cache (correspondance exacte)", async () => {
    const [capture] = await clipJpegs(300);
    if (!capture) throw new Error("capture absente");
    const identify = vi.fn(async () => MATRIX);

    await withResultCache(db, [capture], identify);
    const again = await withResultCache(db, [capture], identify);

    expect(identify).toHaveBeenCalledTimes(1);
    expect(again.source).toBe("cache");
  });

  it("lien (U36) : entrée sans image, retrouvée par son empreinte exacte", async () => {
    const lookup = { frameHashes: [], fingerprint: "link:youtube:dQw4w9WgXcQ" };
    expect(await withQueryTimeout(db, (tx) => storeCachedResult(tx, lookup, MATRIX))).toMatch(/^[0-9a-f-]{36}$/);
    const found = await withQueryTimeout(db, (tx) => findCachedResult(tx, lookup));
    expect(found).toMatchObject({ tmdbId: 603, mediaType: "movie", confidence: 92 });
    const [row] = await sql<{ frames: number }[]>`select count(*)::int as frames from public.result_cache_frames`;
    expect(row?.frames).toBe(0);
  });

  it("mode image : une autre capture seule ne profite pas d'une correspondance proche (2 images exigées)", async () => {
    const images = await clipJpegs(400);
    await withResultCache(db, images, async () => MATRIX);
    const recompressed = await recompress(images[0]!);

    const identify = vi.fn(async () => MATRIX);
    const outcome = await withResultCache(db, [recompressed], identify);

    expect(identify).toHaveBeenCalledTimes(1);
    expect(outcome.source).toBe("ai");
  });

  it("retrouve l'extrait après recompression (correspondance proche)", async () => {
    const images = await clipJpegs(200);
    await withResultCache(db, images, async () => MATRIX);

    const recompressed = await Promise.all(images.slice(0, 3).map(recompress));
    const identify = vi.fn(async () => MATRIX);
    const outcome = await withResultCache(db, recompressed, identify);

    expect(identify).not.toHaveBeenCalled();
    expect(outcome.source).toBe("cache");
  });

  it("ne rapproche pas deux extraits différents d'un même film", async () => {
    await withResultCache(db, await clipJpegs(300), async () => MATRIX);

    const identify = vi.fn(async () => MATRIX);
    const outcome = await withResultCache(db, await clipJpegs(400), identify);

    expect(identify).toHaveBeenCalledTimes(1);
    expect(outcome.source).toBe("ai");
  });

  it("ne retient pas une entrée dont une seule image est proche", async () => {
    const images = await clipJpegs(500);
    await withResultCache(db, images, async () => MATRIX);

    const mixed = [images[0]!, ...(await clipJpegs(600, 3))];
    const identify = vi.fn(async () => MATRIX);
    expect((await withResultCache(db, mixed, identify)).source).toBe("ai");
  });

  it("n'écrit rien sous 80 % de confiance, sauf résultat validé", async () => {
    const images = await clipJpegs(700);
    const lookup = await prepareCacheLookup(images);

    expect(await storeCachedResult(db, lookup, { ...MATRIX, confidence: 79 })).toBeNull();
    expect(await storeCachedResult(db, lookup, { ...MATRIX, confidence: 60 }, { validated: true })).not.toBeNull();
  });

  it("ne répond plus depuis une entrée désactivée par un signalement", async () => {
    const images = await clipJpegs(800);
    const first = await withResultCache(db, images, async () => MATRIX);
    if (first.source !== "ai" || !first.cacheId) throw new Error("entrée attendue");

    await disableCachedResult(db, first.cacheId);

    const identify = vi.fn(async () => MATRIX);
    expect((await withResultCache(db, images, identify)).source).toBe("ai");
    expect(identify).toHaveBeenCalledTimes(1);
  });

  it("ne stocke qu'une ligne par image identique (clé primaire cache_id, frame_hash)", async () => {
    const [image] = await clipJpegs(900, 1);
    await withResultCache(db, [image!, image!, image!], async () => MATRIX);

    const [row] = await sql<{ frames: number }[]>`select count(*)::int as frames from public.result_cache_frames`;
    expect(row?.frames).toBe(1);
  });

  it("renvoie le résultat de l'IA même si l'écriture dans le cache échoue", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // 1re transaction : recherche (réussit) ; 2e : écriture (échoue).
    const outcome = await withResultCache(failingAfterFirstTransaction(), await clipJpegs(1000), async () => MATRIX);

    expect(outcome).toEqual({ source: "ai", result: MATRIX, cacheId: null });
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"event":"result_cache.write_failed","step":"store"'));
    warn.mockRestore();
  });

  it("répond depuis le cache même si le compteur de succès ne peut pas être mis à jour", async () => {
    const images = await clipJpegs(1100);
    await withResultCache(db, images, async () => MATRIX);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    // 1re transaction : recherche (réussit) ; 2e : compteur de succès (échoue).
    const outcome = await withResultCache(failingAfterFirstTransaction(), images, async () => MATRIX);

    expect(outcome.source).toBe("cache");
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"step":"record_hit"'));
    warn.mockRestore();
  });
});

describe("withQueryTimeout", () => {
  it("annule une requête qui dépasse le délai", async () => {
    await expect(withQueryTimeout(db, (tx) => tx.execute(drizzleSql`select pg_sleep(2)`), 200)).rejects.toMatchObject({
      cause: expect.objectContaining({ code: "57014" }),
    });
  });

  it("laisse passer une requête rapide", async () => {
    const rows = await withQueryTimeout(db, (tx) => tx.execute<{ one: number }>(drizzleSql`select 1 as one`));
    expect(rows[0]?.one).toBe(1);
  });
});

/** Base dont toutes les transactions après la première échouent (panne simulée). */
function failingAfterFirstTransaction(): typeof db {
  let calls = 0;
  return new Proxy(db, {
    get(target, property, receiver) {
      if (property === "transaction") {
        return (...args: Parameters<typeof db.transaction>) => {
          calls += 1;
          return calls === 1 ? target.transaction(...args) : Promise.reject(new Error("panne de la base"));
        };
      }
      return Reflect.get(target, property, receiver);
    },
  });
}
