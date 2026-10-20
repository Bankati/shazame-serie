import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { getDb } from "@/server/db/client";
import { persistIdentification } from "@/server/identification/persist";

import { adminSql } from "./helpers";

// Journal des identifications : une ligne par tentative, visiteur ou compte, sans image (RG7).
const sql = adminSql();
const db = getDb();
const VISITOR_ID = "0b8f2c3e-4444-4444-8444-444444444444";

beforeEach(async () => {
  await sql`delete from public.identifications where fingerprint like 'test-persist-%'`;
});

afterAll(async () => {
  await sql`delete from public.identifications where fingerprint like 'test-persist-%'`;
  await sql.end();
});

describe("persistIdentification", () => {
  it("enregistre une identification de visiteur décomptée, avec son coût et ses alternatives", async () => {
    await persistIdentification(db, {
      identity: { kind: "visitor", id: "0b8f2c3e-1111-4111-8111-111111111111" },
      inputKind: "clip",
      fingerprint: "test-persist-1",
      source: "ai",
      outcome: "shown",
      counted: true,
      main: { tmdbId: 603, mediaType: "movie", confidence: 94 },
      alternatives: [{ tmdbId: 604, mediaType: "movie", confidence: 30 }],
      promptVersion: "identify.v1",
      provider: "openai",
      model: "gpt-6.1-sol",
      costMicroEur: 1800,
      latencyMs: 2300,
    });

    const [row] = await sql`
      select visitor_key, user_id, tmdb_id, media_type, confidence, counted, source, outcome, cost_micro_eur, alternatives
      from public.identifications where fingerprint = 'test-persist-1'`;
    expect(row).toMatchObject({
      visitor_key: "0b8f2c3e-1111-4111-8111-111111111111",
      user_id: null,
      tmdb_id: 603,
      media_type: "movie",
      confidence: 94,
      counted: true,
      source: "ai",
      outcome: "shown",
      cost_micro_eur: 1800,
      alternatives: [{ tmdbId: 604, mediaType: "movie", confidence: 30 }],
    });
  });

  it("enregistre un échec non décompté sans résultat", async () => {
    await persistIdentification(db, {
      identity: { kind: "visitor", id: "0b8f2c3e-2222-4222-8222-222222222222" },
      inputKind: "images",
      fingerprint: "test-persist-2",
      source: "ai",
      outcome: "failed",
      counted: false,
      main: null,
      alternatives: [],
      promptVersion: null,
      provider: null,
      model: null,
      costMicroEur: 0,
      latencyMs: null,
    });
    const [row] = await sql`select tmdb_id, counted, outcome, input_kind from public.identifications where fingerprint = 'test-persist-2'`;
    expect(row).toEqual({ tmdb_id: null, counted: false, outcome: "failed", input_kind: "images" });
  });

  it("base sans la migration 0005 (AD-25) : l'identification est quand même enregistrée, sans le mode", async () => {
    // Simule la base commune avant l'arrivée de 0005 sur main : la colonne n'existe pas encore.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await sql`alter table public.identifications rename column input_kind to input_kind_absente`;
    try {
      const id = await persistIdentification(db, {
        identity: { kind: "visitor", id: VISITOR_ID },
        inputKind: "images",
        fingerprint: "test-persist-4",
        source: "ai",
        outcome: "shown",
        counted: true,
        main: { tmdbId: 603, mediaType: "movie", confidence: 94 },
        alternatives: [{ tmdbId: 604, mediaType: "movie", confidence: 30 }],
        promptVersion: "identify-images.v1",
        provider: "openai",
        model: "gpt-6.1-sol",
        costMicroEur: 1800,
        latencyMs: 2300,
      });
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
    } finally {
      await sql`alter table public.identifications rename column input_kind_absente to input_kind`;
    }
    const [row] = await sql`
      select visitor_key, tmdb_id, counted, alternatives, prompt_version, input_kind
      from public.identifications where fingerprint = 'test-persist-4'`;
    expect(row).toEqual({
      visitor_key: VISITOR_ID,
      tmdb_id: 603,
      counted: true,
      alternatives: [{ tmdbId: 604, mediaType: "movie", confidence: 30 }],
      prompt_version: "identify-images.v1",
      input_kind: "clip",
    });
  });

  it("une identification enregistrée avant U34 (sans mode) vaut « clip »", async () => {
    await sql`
      insert into public.identifications (visitor_key, fingerprint, source, outcome)
      values ('0b8f2c3e-3333-4333-8333-333333333333', 'test-persist-3', 'ai', 'failed')`;
    const [row] = await sql`select input_kind from public.identifications where fingerprint = 'test-persist-3'`;
    expect(row).toEqual({ input_kind: "clip" });
  });
});
