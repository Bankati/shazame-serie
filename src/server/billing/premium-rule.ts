import type { SubscriptionStatus } from "./billing-provider";

/**
 * Règle du droit Premium (RG13, RG14) : abonnement actif, ou en retard de paiement / résilié tant que la période
 * payée court. Fonction pure, partagée par la lecture du droit et par l'écriture du webhook.
 */
export function isPremium(
  subscription: { status: SubscriptionStatus; currentPeriodEnd: Date } | null,
  now: Date,
): boolean {
  if (!subscription) return false;
  if (subscription.status === "active") return true;
  if (subscription.status === "past_due" || subscription.status === "canceled") {
    return subscription.currentPeriodEnd.getTime() > now.getTime();
  }
  return false;
}
