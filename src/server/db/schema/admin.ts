import { sql } from "drizzle-orm";
import { bigint, check, date, index, integer, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./accounts";

// Miroir durable du compteur Redis de dépense IA, pour le tableau de bord (jour calculé en Europe/Paris).
export const aiSpendDaily = pgTable(
  "ai_spend_daily",
  {
    day: date("day").primaryKey(),
    totalMicroEur: bigint("total_micro_eur", { mode: "number" }).notNull().default(0),
    calls: integer("calls").notNull().default(0),
  },
  (table) => [check("ai_spend_daily_non_negative", sql`${table.totalMicroEur} >= 0 and ${table.calls} >= 0`)],
).enableRLS();

/** Clés connues de app_settings ; les valeurs initiales sont posées par migration (AD-20). */
export const APP_SETTING_KEYS = [
  "ai_daily_cap_micro_eur",
  "premium_daily_cap",
  "visitor_daily_quota",
  "free_daily_quota",
] as const;
export type AppSettingKey = (typeof APP_SETTING_KEYS)[number];

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => profiles.id, { onDelete: "set null" }),
}).enableRLS();

// Toute mutation admin est journalisée dans la même transaction (invariant 6). L'entrée survit
// à la suppression de l'admin (admin_id passe à null).
export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    adminId: uuid("admin_id").references(() => profiles.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("admin_audit_log_created_idx").on(table.createdAt.desc()),
    index("admin_audit_log_target_idx").on(table.targetType, table.targetId),
  ],
).enableRLS();
