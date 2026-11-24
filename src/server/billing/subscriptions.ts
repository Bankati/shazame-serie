import "server-only";

import { eq } from "drizzle-orm";

import { type Database, withQueryTimeout } from "@/server/db/client";
import { billingEvents, subscriptions } from "@/server/db/schema";

import type { BillingEvent, BillingPlan, ProviderSubscription, SubscriptionStatus } from "./billing-provider";
import { isPremium } from "./premium-rule";

// Abonnements en base (U22). Le statut Premium ne change que par un webhook vérifié dont l'identifiant n'a
// jamais été traité (invariant 5) : l'enregistrement de l'événement et la mise à jour de l'abonnement se font
// dans la même transaction, un événement rejoué ne modifie rien.

export type SubscriptionRow = {
  providerCustomerId: string;
  providerSubscriptionId: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

/** `conflict` : second abonnement payé alors qu'un autre est en cours (double clic) ; à rembourser à la main. */
export type ApplyOutcome = "applied" | "duplicate" | "ignored" | "conflict";

export async function loadSubscription(db: Database, userId: string): Promise<SubscriptionRow | null> {
  const rows = await withQueryTimeout(db, (tx) =>
    tx
      .select({
        providerCustomerId: subscriptions.providerCustomerId,
        providerSubscriptionId: subscriptions.providerSubscriptionId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1),
  );
  return rows[0] ?? null;
}

/**
 * Enregistre l'événement puis l'état de l'abonnement relu chez le prestataire. Abonnement sans compte, sans
 * statut exploitable (premier paiement en cours) ou sans prix connu : l'événement est noté, rien n'est accordé.
 */
export async function applyBillingEvent(
  db: Database,
  event: BillingEvent,
  subscription: ProviderSubscription | null,
  provider: string,
): Promise<ApplyOutcome> {
  return withQueryTimeout(db, async (tx) => {
    const inserted = await tx
      .insert(billingEvents)
      .values({ providerEventId: event.id, type: event.type })
      .onConflictDoNothing()
      .returning({ id: billingEvents.providerEventId });
    if (inserted.length === 0) return "duplicate";

    if (!subscription || !subscription.userId || !subscription.status || !subscription.plan) return "ignored";

    // Ligne verrouillée jusqu'à la fin de la transaction : deux webhooks du même compte s'appliquent l'un après
    // l'autre. Un autre abonnement encore en cours n'est jamais remplacé (double paiement : à rembourser).
    const [existing] = await tx
      .select({
        id: subscriptions.providerSubscriptionId,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
      })
      .from(subscriptions)
      .where(eq(subscriptions.userId, subscription.userId))
      .for("update");
    if (existing && existing.id !== subscription.providerSubscriptionId && isPremium(existing, new Date()))
      return "conflict";

    const values = {
      provider,
      providerCustomerId: subscription.providerCustomerId,
      providerSubscriptionId: subscription.providerSubscriptionId,
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      updatedAt: new Date(),
    };
    await tx
      .insert(subscriptions)
      .values({ userId: subscription.userId, ...values })
      .onConflictDoUpdate({ target: subscriptions.userId, set: values });
    return "applied";
  });
}
