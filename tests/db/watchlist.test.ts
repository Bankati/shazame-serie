import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ensureAccount } from "@/server/auth/profile";
import { getDb } from "@/server/db/client";
import { addToWatchlist, listWatchlist, removeFromWatchlist } from "@/server/watchlist/watchlist";

import { adminSql, secretClient } from "./helpers";

// Critère de fin de U18 : limite de 100 en gratuit, y compris avec des ajouts simultanés ; propriété.
const sql = adminSql();
const db = getDb();
const admin = secretClient();
const PREFIX = `test-watchlist-${Date.now()}`;
const users: string[] = [];
const LIMIT = 100;

async function createAccount(label: string): Promise<string> {
  const { data, error } = await admin.auth.admin.createUser({ email: `${PREFIX}-${label}@example.com`, password: "motdepasse-test", email_confirm: true });
  if (error || !data.user) throw error ?? new Error("utilisateur non créé");
  await ensureAccount(db, { userId: data.user.id, displayName: label });
  users.push(data.user.id);
  return data.user.id;
}

async function fill(userId: string, count: number): Promise<void> {
  await sql`
    insert into public.watchlist_items (user_id, tmdb_id, media_type, added_at)
    select ${userId}, n, 'movie', now() - (n || ' minutes')::interval from generate_series(1, ${count}) as n`;
}

let alice = "";
let bruno = "";

beforeAll(async () => {
  alice = await createAccount("alice");
  bruno = await createAccount("bruno");
});

afterAll(async () => {
  for (const id of users) await admin.auth.admin.deleteUser(id);
  await sql.end();
});

describe("addToWatchlist", () => {
  it("le 101e titre est refusé en gratuit (critère de fin U18)", async () => {
    await fill(alice, 99);
    expect(await addToWatchlist(db, alice, { tmdbId: 5000, mediaType: "movie" }, LIMIT)).toEqual({ status: "added", count: 100 });
    expect(await addToWatchlist(db, alice, { tmdbId: 5001, mediaType: "movie" }, LIMIT)).toEqual({ status: "full", count: 100 });
  });

  it("un titre déjà présent n'est ni dupliqué ni bloqué par la limite", async () => {
    expect(await addToWatchlist(db, alice, { tmdbId: 5000, mediaType: "movie" }, LIMIT)).toEqual({ status: "exists", count: 100 });
  });

  it("même identifiant TMDB, autre type : deux titres distincts", async () => {
    await removeFromWatchlist(db, alice, { tmdbId: 1, mediaType: "movie" });
    expect((await addToWatchlist(db, alice, { tmdbId: 5000, mediaType: "tv" }, LIMIT)).status).toBe("added");
  });

  it("deux ajouts simultanés à 99 titres : un seul passe, jamais 101", async () => {
    await fill(bruno, 99);
    const results = await Promise.all([
      addToWatchlist(db, bruno, { tmdbId: 7001, mediaType: "movie" }, LIMIT),
      addToWatchlist(db, bruno, { tmdbId: 7002, mediaType: "tv" }, LIMIT),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual(["added", "full"]);
    expect(await listWatchlist(db, bruno)).toHaveLength(100);
  });

  it("Premium (limite null) : au-delà de 100", async () => {
    expect((await addToWatchlist(db, bruno, { tmdbId: 7003, mediaType: "movie" }, null)).status).toBe("added");
    expect(await listWatchlist(db, bruno)).toHaveLength(101);
  });
});

describe("listWatchlist / removeFromWatchlist", () => {
  it("chacun ne voit et ne retire que ses titres, plus récents d'abord", async () => {
    const aliceItems = await listWatchlist(db, alice);
    expect(aliceItems[0]).toMatchObject({ tmdbId: 5000, mediaType: "tv" });
    expect(aliceItems.some((item) => item.tmdbId === 7001 || item.tmdbId === 7002)).toBe(false);
    // Bruno retire « 5000 film » : la liste d'Alice n'est pas touchée.
    await removeFromWatchlist(db, bruno, { tmdbId: 5000, mediaType: "movie" });
    expect((await listWatchlist(db, alice)).some((item) => item.tmdbId === 5000 && item.mediaType === "movie")).toBe(true);
  });
});
