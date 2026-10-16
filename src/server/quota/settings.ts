import "server-only";

import { inArray } from "drizzle-orm";
import { z } from "zod";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { appSettings } from "@/server/db/schema";

import type { QuotaLimits } from "./quota";

// Limites lues dans `app_settings` (AD-20, modifiables par l'admin en U26), gardées 60 s en mémoire.
const CACHE_TTL_MS = 60_000;
const positiveInt = z.coerce.number().int().positive();

let cached: { limits: QuotaLimits; expiresAt: number } | undefined;

export async function loadQuotaLimits(db: Database, now: () => number = Date.now): Promise<QuotaLimits> {
  if (cached && cached.expiresAt > now()) {
    return cached.limits;
  }
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({ key: appSettings.key, value: appSettings.value })
      .from(appSettings)
      .where(inArray(appSettings.key, ["visitor_daily_quota", "free_daily_quota", "premium_daily_cap"])),
  );
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const limits: QuotaLimits = {
    visitorDaily: positiveInt.parse(values.visitor_daily_quota),
    freeDaily: positiveInt.parse(values.free_daily_quota),
    premiumDailyCap: positiveInt.parse(values.premium_daily_cap),
  };
  cached = { limits, expiresAt: now() + CACHE_TTL_MS };
  return limits;
}

/** Tests uniquement : oublie les limites gardées en mémoire. */
export function resetQuotaLimitsCache(): void {
  cached = undefined;
}
