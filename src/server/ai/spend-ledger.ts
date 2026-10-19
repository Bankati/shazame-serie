import "server-only";

import { sql } from "drizzle-orm";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { aiSpendDaily } from "@/server/db/schema";

// Miroir durable du compteur Redis (architecture.md) : dépense et nombre d'appels par jour, pour le tableau de bord.

export async function recordAiSpend(db: Database, day: string, costMicroEur: number): Promise<void> {
  await withQueryTimeout(db, (tx) =>
    tx
      .insert(aiSpendDaily)
      .values({ day, totalMicroEur: costMicroEur, calls: 1 })
      .onConflictDoUpdate({
        target: aiSpendDaily.day,
        set: {
          totalMicroEur: sql`${aiSpendDaily.totalMicroEur} + ${costMicroEur}`,
          calls: sql`${aiSpendDaily.calls} + 1`,
        },
      }),
  );
}
