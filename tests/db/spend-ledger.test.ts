import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { recordAiSpend } from "@/server/ai/spend-ledger";
import { getDb } from "@/server/db/client";

import { adminSql } from "./helpers";

// Miroir durable de la dépense IA (tableau de bord admin, U25).
const sql = adminSql();
const db = getDb();
const DAY = "2099-12-31";

beforeEach(async () => {
  await sql`delete from public.ai_spend_daily where day = ${DAY}`;
});

afterAll(async () => {
  await sql`delete from public.ai_spend_daily where day = ${DAY}`;
  await sql.end();
});

describe("recordAiSpend", () => {
  it("cumule la dépense et le nombre d'appels du jour", async () => {
    await recordAiSpend(db, DAY, 1_800);
    await Promise.all([recordAiSpend(db, DAY, 500), recordAiSpend(db, DAY, 700)]);

    const [row] = await sql<{ total: number; calls: number }[]>`
      select total_micro_eur::int as total, calls from public.ai_spend_daily where day = ${DAY}`;
    expect(row).toEqual({ total: 3_000, calls: 3 });
  });
});
