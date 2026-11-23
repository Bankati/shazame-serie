import "server-only";

import { z } from "zod";

import type { AppSettingKey } from "@/server/db/schema";

// Validation pure des réglages modifiables par l'admin (U26). Les quotas sont des entiers ; le plafond IA est
// saisi en euros (deux décimales au plus) et stocké en micro-euros, comme le reste des coûts.

export const QUOTA_MIN = 1;
export const QUOTA_MAX = 10_000;
export const AI_CAP_MAX_EUR = 1_000;
const MICRO_EUR_PER_CENT = 10_000;

export const EDITABLE_SETTINGS = ["visitor_daily_quota", "free_daily_quota", "premium_daily_cap", "ai_daily_cap_micro_eur"] as const satisfies readonly AppSettingKey[];
export type EditableSetting = (typeof EDITABLE_SETTINGS)[number];

export const settingKeySchema = z.enum(EDITABLE_SETTINGS);

const quotaSchema = z
  .string()
  .trim()
  .regex(/^\d+$/)
  .transform(Number)
  .pipe(z.number().int().min(QUOTA_MIN).max(QUOTA_MAX));

// « 2,50 » ou « 2.50 » : virgule française acceptée. Converti en centimes avant tout calcul (jamais de flottant).
const eurosSchema = z
  .string()
  .trim()
  .regex(/^\d{1,4}([.,]\d{1,2})?$/)
  .transform((raw) => {
    const [whole = "0", fraction = ""] = raw.replace(",", ".").split(".");
    return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  })
  .pipe(z.number().int().min(0).max(AI_CAP_MAX_EUR * 100));

/** Valeur stockée dans `app_settings` à partir de la saisie, ou null si la saisie est invalide. */
export function parseSettingInput(key: EditableSetting, raw: string): number | null {
  if (key === "ai_daily_cap_micro_eur") {
    const cents = eurosSchema.safeParse(raw);
    return cents.success ? cents.data * MICRO_EUR_PER_CENT : null;
  }
  const quota = quotaSchema.safeParse(raw);
  return quota.success ? quota.data : null;
}

/** Valeur affichée dans le champ de saisie (euros avec virgule pour le plafond IA). */
export function formatSettingInput(key: EditableSetting, stored: number): string {
  if (key !== "ai_daily_cap_micro_eur") return String(stored);
  const cents = Math.round(stored / MICRO_EUR_PER_CENT);
  return `${Math.trunc(cents / 100)},${String(cents % 100).padStart(2, "0")}`;
}
