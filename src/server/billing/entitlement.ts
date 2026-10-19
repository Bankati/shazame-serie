import "server-only";

import { WATCHLIST_FREE_LIMIT } from "@/shared/watchlist";

// Droits d'un compte (architecture.md : `getEntitlement()`, jamais stocké en double, jamais lu depuis le
// client). Avant U22 (paiement), tout compte est gratuit ; U22 lira l'abonnement (statut et fin de période).

export type Plan = "free" | "premium";

/** Limite de la liste de suivi : 100 titres en gratuit, illimitée en Premium (CDC 12.5). */
export { WATCHLIST_FREE_LIMIT };

export async function getEntitlement(userId: string): Promise<Plan> {
  void userId;
  return "free";
}

export function watchlistLimit(plan: Plan): number | null {
  return plan === "premium" ? null : WATCHLIST_FREE_LIMIT;
}
