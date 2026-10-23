import "server-only";

import { getDb } from "@/server/db/client";
import { WATCHLIST_FREE_LIMIT } from "@/shared/watchlist";

import { isPremium } from "./premium-rule";
import { loadSubscription } from "./subscriptions";

// Droits d'un compte (architecture.md : `getEntitlement()`, jamais stocké en double, jamais lu depuis le
// client). Premium = abonnement actif, ou en retard de paiement / résilié tant que la période payée court
// (RG13, RG14). Lu à chaque requête : aucune copie du statut ailleurs.

export type Plan = "free" | "premium";

/** Limite de la liste de suivi : 100 titres en gratuit, illimitée en Premium (CDC 12.5). */
export { WATCHLIST_FREE_LIMIT };
export { isPremium };

export async function getEntitlement(userId: string, now: Date = new Date()): Promise<Plan> {
  return isPremium(await loadSubscription(getDb(), userId), now) ? "premium" : "free";
}

export function watchlistLimit(plan: Plan): number | null {
  return plan === "premium" ? null : WATCHLIST_FREE_LIMIT;
}
