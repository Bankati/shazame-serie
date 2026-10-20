import "server-only";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { identifications, type StoredAlternative } from "@/server/db/schema";
import { log } from "@/server/log";
import type { QuotaIdentity } from "@/server/quota/quota";

// Journal des identifications (architecture.md, Storage Model) : historique (U17), statistiques (U25), coût IA.
// Jamais d'image (RG7) : seulement l'empreinte d'extrait calculée par le serveur et le résultat.

export type IdentificationRecord = {
  identity: QuotaIdentity;
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
        userId: record.identity.kind === "user" ? record.identity.id : null,
        visitorKey: record.identity.kind === "visitor" ? record.identity.id : null,
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
  } catch {
    log.error("identification.persist_failed", { source: record.source, outcome: record.outcome });
    return null;
  }
}
