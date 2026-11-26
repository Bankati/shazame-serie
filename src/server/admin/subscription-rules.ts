import "server-only";

import type { BillingPlan, ProviderSubscription, SubscriptionStatus } from "@/server/billing/billing-provider";
import { isPremium } from "@/server/billing/premium-rule";

// Règles pures de la correction d'un abonnement par l'admin (U26c). L'abonnement vient toujours du
// prestataire (invariant 5) : l'admin ne saisit jamais un statut. Testées à part.

export type StoredSubscription = {
  providerSubscriptionId: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

export type SyncRefusal = "not_found" | "other_account" | "not_usable" | "conflict" | "no_subscription";

export type SyncDecision =
  | { kind: "refused"; reason: Exclude<SyncRefusal, "no_subscription"> }
  | { kind: "unchanged" }
  | { kind: "write"; before: Record<string, unknown>; after: Record<string, unknown> };

const FIELDS = ["providerSubscriptionId", "plan", "status", "currentPeriodEnd", "cancelAtPeriodEnd"] as const;

/** Valeur journalisable (date en ISO) ; jamais de donnée de carte : aucune n'est connue (RG12). */
const loggable = (value: unknown) => (value instanceof Date ? value.toISOString() : value);

export function decideSync(
  userId: string,
  account: { exists: boolean },
  stored: StoredSubscription | null,
  fetched: ProviderSubscription,
  now: Date,
): SyncDecision {
  if (!account.exists) return { kind: "refused", reason: "not_found" };
  // Métadonnées posées au paiement : un abonnement d'un autre compte n'est jamais rattaché ici.
  if (fetched.userId !== null && fetched.userId !== userId) return { kind: "refused", reason: "other_account" };
  if (!fetched.status || !fetched.plan) return { kind: "refused", reason: "not_usable" };
  // Même règle que le webhook : un autre abonnement encore en cours n'est pas remplacé (double paiement).
  if (stored && stored.providerSubscriptionId !== fetched.providerSubscriptionId && isPremium(stored, now)) {
    return { kind: "refused", reason: "conflict" };
  }

  const next: StoredSubscription = {
    providerSubscriptionId: fetched.providerSubscriptionId,
    plan: fetched.plan,
    status: fetched.status,
    currentPeriodEnd: fetched.currentPeriodEnd,
    cancelAtPeriodEnd: fetched.cancelAtPeriodEnd,
  };
  const before: Record<string, unknown> = {};
  const after: Record<string, unknown> = {};
  for (const field of FIELDS) {
    const previous = stored ? loggable(stored[field]) : null;
    const value = loggable(next[field]);
    if (previous !== value) {
      before[field] = previous;
      after[field] = value;
    }
  }
  return Object.keys(after).length === 0 ? { kind: "unchanged" } : { kind: "write", before, after };
}
