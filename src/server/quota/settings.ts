import "server-only";

import { inArray } from "drizzle-orm";
import { z } from "zod";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { appSettings } from "@/server/db/schema";

import type { QuotaLimits } from "./quota";

// Limites lues dans `app_settings` (AD-20, modifiables par l'admin en U26) : quotas et plafond de dépense IA,
// gardées 60 s en mémoire.
const CACHE_TTL_MS = 60_000;
const positiveInt = z.coerce.number().int().positive();

type AppLimits = { quota: QuotaLimits; aiDailyCapMicroEur: number };

let cached: { limits: AppLimits; expiresAt: number } | undefined;

async function loadAppLimits(db: Database, now: () => number): Promise<AppLimits> {
  if (cached && cached.expiresAt > now()) {
    return cached.limits;
  }
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({ key: appSettings.key, value: appSettings.value })
      .from(appSettings)
      .where(inArray(appSettings.key, ["visitor_daily_quota", "free_daily_quota", "premium_daily_cap", "ai_daily_cap_micro_eur"])),
  );
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const limits: AppLimits = {
    quota: {
      visitorDaily: positiveInt.parse(values.visitor_daily_quota),
      freeDaily: positiveInt.parse(values.free_daily_quota),
      premiumDailyCap: positiveInt.parse(values.premium_daily_cap),
    },
    // 0 est permis : il met l'IA en pause (RG5).
    aiDailyCapMicroEur: z.coerce.number().int().nonnegative().parse(values.ai_daily_cap_micro_eur),
  };
  cached = { limits, expiresAt: now() + CACHE_TTL_MS };
  return limits;
}

export async function loadQuotaLimits(db: Database, now: () => number = Date.now): Promise<QuotaLimits> {
  return (await loadAppLimits(db, now)).quota;
}

/** Plafond quotidien de dépense IA en micro-euros (RG5, AD-20 : 10 € pendant la bêta). */
export async function loadAiDailyCap(db: Database, now: () => number = Date.now): Promise<number> {
  return (await loadAppLimits(db, now)).aiDailyCapMicroEur;
}

/** Tests uniquement : oublie les limites gardées en mémoire. */
export function resetQuotaLimitsCache(): void {
  cached = undefined;
}
