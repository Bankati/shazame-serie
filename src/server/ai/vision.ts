import "server-only";

import { getRedis } from "@/server/cache/redis";
import { getDb } from "@/server/db/client";
import { env } from "@/server/env";
import { captureSystemEvent } from "@/server/observability/posthog-server";
import { loadAiDailyCap } from "@/server/quota/settings";

import { getVisionProvider } from "./openai-vision-provider";
import { SpendGuardedVisionProvider } from "./spend-guard";
import { recordAiSpend } from "./spend-ledger";
import { createMemorySpendStore, createRedisSpendStore } from "./spend-store";
import type { VisionProvider } from "./vision-provider";

// Point d'entrée de l'IA pour l'application : toujours derrière la garde de dépense (RG5, invariant 2).
// `getVisionProvider` (sans garde) n'est utilisé directement que par les tests en direct.

let guarded: VisionProvider | undefined;
// Sans Upstash (local sans clés, CI) : compteur en mémoire ; en production, env.ts exige Upstash.
const memoryStore = createMemorySpendStore();

/** Fournisseur de vision protégé par le plafond de dépense, ou null si OpenAI n'est pas configuré. */
export function getGuardedVisionProviderOrNull(): VisionProvider | null {
  if (!env.OPENAI_API_KEY) {
    return null;
  }
  if (!guarded) {
    const redis = getRedis();
    guarded = new SpendGuardedVisionProvider({
      inner: getVisionProvider(),
      model: env.OPENAI_VISION_MODEL,
      store: redis ? createRedisSpendStore(redis) : memoryStore,
      dailyCapMicroEur: () => loadAiDailyCap(getDb()),
      recordSpend: (day, cost) => recordAiSpend(getDb(), day, cost),
      onCapReached: (day, cap) => captureSystemEvent("ai_spend_cap_reached", { day, cap_micro_eur: cap }),
    });
  }
  return guarded;
}
