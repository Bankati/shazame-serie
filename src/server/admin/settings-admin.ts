import "server-only";

import { eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { appSettings } from "@/server/db/schema";
import { resetQuotaLimitsCache } from "@/server/quota/settings";

import { withAdminAudit } from "./audit";
import { EDITABLE_SETTINGS, type EditableSetting } from "./settings-input";

// Réglages modifiables par l'admin (U26, AD-20) : quotas et plafond de dépense IA. Les autres instances relisent
// les limites au plus tard 60 s après le changement (cache de `quota/settings.ts`).

export type AdminSetting = { key: EditableSetting; value: number; updatedAt: Date };

const storedNumber = z.coerce.number().int().nonnegative();

export async function loadAdminSettings(db: Database): Promise<AdminSetting[]> {
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({ key: appSettings.key, value: appSettings.value, updatedAt: appSettings.updatedAt })
      .from(appSettings)
      .where(inArray(appSettings.key, [...EDITABLE_SETTINGS])),
  );
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return EDITABLE_SETTINGS.flatMap((key) => {
    const row = byKey.get(key);
    // Réglage absent : posé par migration, son absence est une erreur de déploiement, pas une saisie.
    return row ? [{ key, value: storedNumber.parse(row.value), updatedAt: row.updatedAt }] : [];
  });
}

export type SettingUpdateOutcome = "changed" | "unchanged" | "missing";

/** Enregistre un réglage et le journalise dans la même transaction (invariant 6). */
export async function updateSetting(
  db: Database,
  adminId: string,
  key: EditableSetting,
  value: number,
): Promise<SettingUpdateOutcome> {
  const outcome = await withAdminAudit<SettingUpdateOutcome>(db, adminId, async (tx) => {
    const [current] = await tx
      .select({ value: appSettings.value })
      .from(appSettings)
      .where(eq(appSettings.key, key))
      .for("update");
    if (!current) return { result: "missing", audit: null };
    const before = storedNumber.safeParse(current.value);
    if (before.success && before.data === value) return { result: "unchanged", audit: null };

    await tx.update(appSettings).set({ value, updatedAt: new Date(), updatedBy: adminId }).where(eq(appSettings.key, key));
    return {
      result: "changed",
      audit: { action: "setting.update", targetType: "setting", targetId: key, before: { value: current.value }, after: { value } },
    };
  });
  if (outcome === "changed") resetQuotaLimitsCache();
  return outcome;
}
