import "server-only";

// Abstraction du paiement (architecture.md, BillingProvider ; Stripe depuis AD-50). Les statuts du prestataire
// sont convertis à la frontière en statut normalisé : le reste de l'application ne connaît pas Stripe.

export type BillingPlan = "monthly" | "yearly";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "expired";

/** Abonnement tel que l'application le stocke. `status` null : premier paiement pas encore abouti, rien à enregistrer. */
export type ProviderSubscription = {
  providerSubscriptionId: string;
  providerCustomerId: string;
  /** Compte de l'application, posé à la création du paiement (métadonnées) ; null si absent. */
  userId: string | null;
  plan: BillingPlan | null;
  status: SubscriptionStatus | null;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
};

/** Événement de webhook vérifié, réduit à ce dont l'application a besoin. */
export type BillingEvent = { id: string; type: string; subscriptionId: string | null };

export type BillingInvoice = {
  id: string;
  number: string | null;
  createdAt: Date;
  /** Montant TTC en centimes (montants en entiers, code-standards.md). */
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void" | "uncollectible";
  url: string | null;
};

export class InvalidSignatureError extends Error {
  constructor() {
    super("Signature du webhook invalide");
    this.name = "InvalidSignatureError";
  }
}

export interface BillingProvider {
  /** Page de paiement hébergée ; renvoie son adresse. */
  createCheckout(input: {
    userId: string;
    email: string | null;
    plan: BillingPlan;
    customerId: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<string>;
  /** Portail client du prestataire (carte, factures, résiliation) ; renvoie son adresse. */
  createPortalSession(input: { customerId: string; returnUrl: string }): Promise<string>;
  /** Vérifie la signature sur le corps brut ; lève InvalidSignatureError sinon. */
  parseWebhook(rawBody: string, signature: string | null): BillingEvent;
  /** État à jour d'un abonnement (relu à chaque événement : l'ordre d'arrivée des webhooks n'est pas garanti). */
  getSubscription(subscriptionId: string): Promise<ProviderSubscription>;
  listInvoices(customerId: string): Promise<BillingInvoice[]>;
}
