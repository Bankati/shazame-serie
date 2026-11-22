import type { BillingPlan } from "./billing-provider";

// Prix des plans en centimes (CDC : 2,99 € par mois, 24,99 € par an), mêmes valeurs que les textes de tarifs.
// Les prix facturés sont ceux de Stripe ; ces constantes servent à l'estimation du tableau de bord (U25).
export const PLAN_PRICE_CENTS: Record<BillingPlan, number> = { monthly: 299, yearly: 2_499 };
