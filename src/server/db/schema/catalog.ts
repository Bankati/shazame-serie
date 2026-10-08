import { index, integer, pgTable, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./accounts";
import { mediaType } from "./enums";

export const watchlistItems = pgTable(
  "watchlist_items",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    mediaType: mediaType("media_type").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Un titre n'apparaît qu'une fois par liste (architecture.md).
    primaryKey({ columns: [table.userId, table.tmdbId, table.mediaType] }),
    index("watchlist_items_user_added_idx").on(table.userId, table.addedAt.desc()),
  ],
).enableRLS();
