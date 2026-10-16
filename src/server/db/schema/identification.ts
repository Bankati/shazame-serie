import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./accounts";
import { identificationOutcome, identificationSource, mediaType, reportStatus } from "./enums";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

/** Alternative proposée avec le résultat principal (stockée telle quelle, validée par zod à l'écriture). */
export type StoredAlternative = { tmdbId: number; mediaType: "movie" | "tv"; confidence: number };

export const identifications = pgTable(
  "identifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Un visiteur n'a pas de compte : visitor_key (cookie signé) à la place de user_id.
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "cascade" }),
    visitorKey: text("visitor_key"),
    // Empreinte calculée par le serveur (invariant 4) : SHA-256 hexadécimal des dHash triés.
    fingerprint: text("fingerprint").notNull(),
    tmdbId: integer("tmdb_id"),
    mediaType: mediaType("media_type"),
    confidence: smallint("confidence"),
    alternatives: jsonb("alternatives").$type<StoredAlternative[]>().notNull().default([]),
    // RG3 : vrai seulement après quota.commit() (résultat ≥ 50 % issu d'un appel IA).
    counted: boolean("counted").notNull().default(false),
    source: identificationSource("source").notNull(),
    outcome: identificationOutcome("outcome").notNull(),
    promptVersion: text("prompt_version"),
    provider: text("provider"),
    model: text("model"),
    costMicroEur: integer("cost_micro_eur").notNull().default(0),
    latencyMs: integer("latency_ms"),
    createdAt: createdAt(),
  },
  (table) => [
    check("identifications_confidence_range", sql`${table.confidence} between 0 and 100`),
    check("identifications_cost_non_negative", sql`${table.costMicroEur} >= 0`),
    // Toute identification appartient à un compte ou à un visiteur (quota RG1, RG2).
    check("identifications_owner_present", sql`${table.userId} is not null or ${table.visitorKey} is not null`),
    // Historique (RG11 : 50 dernières) et purge des enregistrements de plus de 2 ans.
    index("identifications_user_created_idx").on(table.userId, table.createdAt.desc()),
    index("identifications_visitor_created_idx").on(table.visitorKey, table.createdAt.desc()),
    index("identifications_created_idx").on(table.createdAt),
  ],
).enableRLS();

export const resultCache = pgTable(
  "result_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fingerprint: text("fingerprint").notNull().unique(),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaType("media_type").notNull(),
    confidence: smallint("confidence").notNull(),
    alternatives: jsonb("alternatives").$type<StoredAlternative[]>().notNull().default([]),
    validated: boolean("validated").notNull().default(false),
    // Désactivée par un signalement jusqu'à revue admin.
    disabled: boolean("disabled").notNull().default(false),
    hits: integer("hits").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [check("result_cache_confidence_range", sql`${table.confidence} between 0 and 100`)],
).enableRLS();

export const resultCacheFrames = pgTable(
  "result_cache_frames",
  {
    cacheId: uuid("cache_id")
      .notNull()
      .references(() => resultCache.id, { onDelete: "cascade" }),
    // dHash 64 bits (signé côté PostgreSQL) ; distance de Hamming : bit_count((a # b)::bit(64)).
    frameHash: bigint("frame_hash", { mode: "bigint" }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.cacheId, table.frameHash] })],
).enableRLS();

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identificationId: uuid("identification_id").references(() => identifications.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),
    // Un identifiant TMDB n'est unique que par type : le type accompagne chaque identifiant.
    proposedTmdbId: integer("proposed_tmdb_id"),
    proposedMediaType: mediaType("proposed_media_type"),
    correctedTmdbId: integer("corrected_tmdb_id"),
    correctedMediaType: mediaType("corrected_media_type"),
    // RG8 : images conservées uniquement avec consentement explicite.
    imagesConsent: boolean("images_consent").notNull().default(false),
    storagePaths: text("storage_paths").array().notNull().default(sql`'{}'::text[]`),
    status: reportStatus("status").notNull().default("open"),
    createdAt: createdAt(),
  },
  (table) => [
    check(
      "reports_images_require_consent",
      sql`${table.imagesConsent} or cardinality(${table.storagePaths}) = 0`,
    ),
    index("reports_status_created_idx").on(table.status, table.createdAt),
  ],
).enableRLS();
