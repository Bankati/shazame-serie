import "server-only";

import { sql } from "drizzle-orm";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { identificationInputKind, identifications, type StoredAlternative } from "@/server/db/schema";
import { log } from "@/server/log";
import { errorCode } from "@/server/log-error";
import type { QuotaIdentity } from "@/server/quota/quota";

// Journal des identifications (architecture.md, Storage Model) : historique (U17), statistiques (U25), coût IA.
// Jamais d'image (RG7) : seulement l'empreinte d'extrait calculée par le serveur et le résultat.

export type IdentificationRecord = {
  identity: QuotaIdentity;
  /** Mode d'identification (AD-42). */
  inputKind: (typeof identificationInputKind.enumValues)[number];
  fingerprint: string;
  source: "ai" | "cache";
  outcome: "shown" | "low_confidence" | "failed";
  counted: boolean;
  main: { tmdbId: number; mediaType: "movie" | "tv"; confidence: number } | null;
  alternatives: StoredAlternative[];
  promptVersion: string | null;
  provider: string | null;
  model: string | null;
  costMicroEur: number;
  latencyMs: number | null;
};

/**
 * Écrit l'identification et renvoie son identifiant (signalement, U20) ; un échec d'écriture ne doit pas
 * priver l'utilisateur de son résultat : null dans ce cas.
 */
export async function persistIdentification(db: Database, record: IdentificationRecord): Promise<string | null> {
  try {
    const [row] = await withQueryTimeout(db, (tx) =>
      tx.insert(identifications).values({
        userId: ownerOf(record).userId,
        visitorKey: ownerOf(record).visitorKey,
        inputKind: record.inputKind,
        fingerprint: record.fingerprint,
        tmdbId: record.main?.tmdbId ?? null,
        mediaType: record.main?.mediaType ?? null,
        confidence: record.main?.confidence ?? null,
        alternatives: record.alternatives,
        counted: record.counted,
        source: record.source,
        outcome: record.outcome,
        promptVersion: record.promptVersion,
        provider: record.provider,
        model: record.model,
        costMicroEur: record.costMicroEur,
        latencyMs: record.latencyMs,
      }).returning({ id: identifications.id }),
    );
    return row?.id ?? null;
  } catch (error) {
    if (errorCode(error) === UNDEFINED_COLUMN) {
      return persistWithoutInputKind(db, record);
    }
    log.error("identification.persist_failed", { source: record.source, outcome: record.outcome, code: errorCode(error) });
    return null;
  }
}

// Base sans la migration 0005 (colonne `input_kind`) : AD-25 veut que le code tourne avant et après la
// migration, or la base est commune à la préproduction et à la production (AD-27) et 0005 n'y est appliquée
// qu'à l'arrivée sur main. Drizzle nomme toutes les colonnes dans un insert : repli sans la colonne, qui prend
// sa valeur par défaut (« clip ») une fois créée. À retirer une fois 0005 appliquée en production (U34).
const UNDEFINED_COLUMN = "42703";

async function persistWithoutInputKind(db: Database, record: IdentificationRecord): Promise<string | null> {
  try {
    const { userId, visitorKey } = ownerOf(record);
    const rows = await withQueryTimeout(db, (tx) =>
      tx.execute<{ id: string }>(sql`
        insert into ${identifications} (
          user_id, visitor_key, fingerprint, tmdb_id, media_type, confidence, alternatives, counted, source, outcome,
          prompt_version, provider, model, cost_micro_eur, latency_ms
        ) values (
          ${userId}, ${visitorKey}, ${record.fingerprint}, ${record.main?.tmdbId ?? null}, ${record.main?.mediaType ?? null},
          ${record.main?.confidence ?? null}, ${JSON.stringify(record.alternatives)}::jsonb, ${record.counted},
          ${record.source}, ${record.outcome}, ${record.promptVersion}, ${record.provider}, ${record.model},
          ${record.costMicroEur}, ${record.latencyMs}
        ) returning id`),
    );
    log.warn("identification.persisted_without_input_kind", { input_kind: record.inputKind });
    return rows[0]?.id ?? null;
  } catch (error) {
    log.error("identification.persist_failed", { source: record.source, outcome: record.outcome, code: errorCode(error) });
    return null;
  }
}

function ownerOf(record: IdentificationRecord): { userId: string | null; visitorKey: string | null } {
  return record.identity.kind === "user"
    ? { userId: record.identity.id, visitorKey: null }
    : { userId: null, visitorKey: record.identity.id };
}
