import { sql } from "drizzle-orm";
import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";

import { accountStatus, consentKind, userRole } from "./enums";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

// Toutes les tables activent la RLS sans politique : la clé publique Supabase n'ouvre rien,
// l'application passe uniquement par le serveur (architecture.md, Auth and Access Model).

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  role: userRole("role").notNull().default("user"),
  status: accountStatus("status").notNull().default("active"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: createdAt(),
}).enableRLS();

export const consents = pgTable(
  "consents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    kind: consentKind("kind").notNull(),
    version: text("version").notNull(),
    granted: boolean("granted").notNull(),
    createdAt: createdAt(),
  },
  // Dernier consentement par type : RG17 (b2b) et version des CGU acceptée.
  (table) => [index("consents_user_kind_created_idx").on(table.userId, table.kind, table.createdAt.desc())],
).enableRLS();

export const dataExports = pgTable(
  "data_exports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true })
      .notNull()
      .default(sql`now() + interval '24 hours'`),
    createdAt: createdAt(),
  },
  // Cron horaire : suppression des exports expirés.
  (table) => [index("data_exports_expires_at_idx").on(table.expiresAt)],
).enableRLS();
