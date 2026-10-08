import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { adminSql, EXPECTED_TABLES, PRIVATE_BUCKETS, publicClient, secretClient } from "./helpers";

// Critère de fin de U03 : la migration produit le schéma, et la clé publique Supabase ne lit aucune table.
const sql = adminSql();
const admin = secretClient();
const email = `rls-${randomUUID()}@local.test`;
const password = `Test-${randomUUID()}`;
let userId: string;

beforeAll(async () => {
  // Des lignes existent dans chaque table sensible, pour qu'une lecture vide prouve bien la RLS.
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  userId = data.user.id;
  await sql`insert into public.profiles (id, display_name) values (${userId}, 'Test RLS')`;
  await sql`insert into public.watchlist_items (user_id, tmdb_id, media_type) values (${userId}, 603, 'movie')`;
  await sql`insert into public.identifications (user_id, fingerprint, source, outcome) values (${userId}, 'test', 'ai', 'failed')`;
});

afterAll(async () => {
  // La suppression du compte Auth efface le profil et ses lignes (on delete cascade).
  if (userId) await admin.auth.admin.deleteUser(userId);
  await sql.end();
});

describe("schéma", () => {
  it("contient exactement les tables de l'architecture", async () => {
    const rows = await sql<{ tablename: string }[]>`
      select tablename from pg_tables where schemaname = 'public' order by tablename`;
    expect(rows.map((row) => row.tablename)).toEqual([...EXPECTED_TABLES]);
  });

  it("active la RLS sur chaque table, sans aucune politique", async () => {
    const withoutRls = await sql`select tablename from pg_tables where schemaname = 'public' and not rowsecurity`;
    const policies = await sql`select tablename, policyname from pg_policies where schemaname = 'public'`;
    expect(withoutRls).toEqual([]);
    expect(policies).toEqual([]);
  });

  it("pose les réglages initiaux d'AD-20", async () => {
    const rows = await sql<{ key: string; value: number }[]>`select key, value from public.app_settings order by key`;
    expect(Object.fromEntries(rows.map((row) => [row.key, row.value]))).toEqual({
      ai_daily_cap_micro_eur: 10_000_000,
      free_daily_quota: 15,
      premium_daily_cap: 100,
      visitor_daily_quota: 3,
    });
  });

  it("efface en cascade les données d'un compte supprimé", async () => {
    const { data, error } = await admin.auth.admin.createUser({ email: `cascade-${randomUUID()}@local.test`, password });
    if (error) throw error;
    const id = data.user.id;
    await sql`insert into public.profiles (id) values (${id})`;
    await sql`insert into public.watchlist_items (user_id, tmdb_id, media_type) values (${id}, 27205, 'movie')`;

    await admin.auth.admin.deleteUser(id);

    const [row] = await sql<{ profiles: number; items: number }[]>`
      select (select count(*)::int from public.profiles where id = ${id}) as profiles,
             (select count(*)::int from public.watchlist_items where user_id = ${id}) as items`;
    expect(row).toEqual({ profiles: 0, items: 0 });
  });

  it.each(EXPECTED_TABLES)("la RLS seule masque les lignes de %s, même si un droit est accordé par erreur", async (table) => {
    // Indépendant de la migration 0002 : on accorde select à anon dans une transaction annulée.
    const rollback = new Error("rollback");
    await sql
      .begin(async (tx) => {
        await tx.unsafe(`grant select on public.${table} to anon`);
        await tx`set local role anon`;
        const [row] = await tx.unsafe<{ n: number }[]>(`select count(*)::int as n from public.${table}`);
        expect(row?.n).toBe(0);
        throw rollback;
      })
      .catch((error: unknown) => {
        if (error !== rollback) throw error;
      });
  });

  it("refuse une identification sans compte ni visiteur", async () => {
    await expect(
      sql`insert into public.identifications (fingerprint, source, outcome) values ('orphan', 'ai', 'failed')`,
    ).rejects.toThrow(/identifications_owner_present/);
  });

  it("ne donne aucun droit aux rôles de l'API publique, y compris sur les futures tables", async () => {
    const grants = await sql`
      select table_name, grantee from information_schema.role_table_grants
      where table_schema = 'public' and grantee in ('anon', 'authenticated')`;
    expect(grants).toEqual([]);

    await sql`create table public.zz_future_table (id int)`;
    try {
      const [row] = await sql<{ anon: boolean }[]>`
        select has_table_privilege('anon', 'public.zz_future_table', 'select') as anon`;
      expect(row?.anon).toBe(false);
    } finally {
      await sql`drop table public.zz_future_table`;
    }
  });
});

describe.each([
  ["visiteur (clé publique)", () => Promise.resolve(publicClient())],
  [
    "utilisateur connecté (clé publique + session)",
    async () => {
      const client = publicClient();
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return client;
    },
  ],
])("accès direct à la base : %s", (_label, makeClient) => {
  let client: SupabaseClient;

  beforeAll(async () => {
    client = await makeClient();
  });

  it.each(EXPECTED_TABLES)("ne lit aucune ligne de %s", async (table) => {
    const { data } = await client.from(table).select("*").limit(1);
    // Refus explicite (data null) ou résultat vide : dans les deux cas, rien ne fuit.
    expect(data ?? []).toEqual([]);
  });

  it("ne peut rien écrire", async () => {
    const { error } = await client.from("app_settings").upsert({ key: "free_daily_quota", value: 9999 });
    expect(error).not.toBeNull();
    const [row] = await sql<{ value: number }[]>`select value from public.app_settings where key = 'free_daily_quota'`;
    expect(row?.value).toBe(15);
  });

  it.each(PRIVATE_BUCKETS)("ne peut ni lister ni déposer dans le bucket %s", async (bucket) => {
    const { data: listed } = await client.storage.from(bucket).list();
    expect(listed ?? []).toEqual([]);
    const upload = await client.storage.from(bucket).upload(`test-${randomUUID()}.json`, "{}", {
      contentType: "application/json",
    });
    expect(upload.error).not.toBeNull();
  });
});

describe("stockage", () => {
  it("crée les trois buckets en privé", async () => {
    const rows = await sql<{ id: string; public: boolean }[]>`
      select id, public from storage.buckets where id in ('avatars', 'exports', 'reports') order by id`;
    expect(rows).toEqual(PRIVATE_BUCKETS.map((id) => ({ id, public: false })));
  });
});
