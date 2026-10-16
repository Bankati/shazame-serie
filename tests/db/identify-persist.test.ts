import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { getDb } from "@/server/db/client";
import { persistIdentification } from "@/server/identification/persist";

import { adminSql } from "./helpers";

// Journal des identifications : une ligne par tentative, visiteur ou compte, sans image (RG7).
const sql = adminSql();
const db = getDb();

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
    const [row] = await sql`select tmdb_id, counted, outcome from public.identifications where fingerprint = 'test-persist-2'`;
    expect(row).toEqual({ tmdb_id: null, counted: false, outcome: "failed" });
  });
});
