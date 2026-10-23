import "server-only";

import Stripe from "stripe";

import { env } from "@/server/env";

import {
  type BillingEvent,
  type BillingInvoice,
  type BillingPlan,
  type BillingProvider,
  InvalidSignatureError,
  type ProviderSubscription,
  type SubscriptionStatus,
} from "../billing-provider";

// Adaptateur Stripe (U22, AD-50) : Checkout hébergé en mode abonnement, portail client, webhooks signés.
// Version d'API figée par le SDK installé (library-docs.md). Aucune donnée de carte ne transite chez nous (RG12).

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const INVOICE_LIMIT = 12;
const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);
const SHOWN_INVOICE_STATUSES = new Set<string>(["paid", "open", "void", "uncollectible"]);

export type StripePrices = { monthly: string; yearly: string };

/** Statut Stripe → statut normalisé. `incomplete` : premier paiement en cours, rien n'est accordé (null). */
export function normalizeStatus(status: string): SubscriptionStatus | null {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
    case "paused":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete_expired":
      return "expired";
    default:
      return null;
  }
}

function idOf(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function toProviderSubscription(subscription: Stripe.Subscription, prices: StripePrices): ProviderSubscription {
  const items = subscription.items.data;
  const priceIds = items.map((item) => item.price.id);
  const plan: BillingPlan | null = priceIds.includes(prices.yearly)
    ? "yearly"
    : priceIds.includes(prices.monthly)
      ? "monthly"
      : null;
  // Depuis l'API 2025-03-31, la fin de période est portée par chaque ligne : on garde la plus lointaine.
  const periodEnd = Math.max(0, ...items.map((item) => item.current_period_end));
  const userId = subscription.metadata.userId;
  return {
    providerSubscriptionId: subscription.id,
    providerCustomerId: idOf(subscription.customer) ?? "",
    userId: typeof userId === "string" && userId !== "" ? userId : null,
    plan,
    status: normalizeStatus(subscription.status),
    currentPeriodEnd: new Date(periodEnd * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end || subscription.cancel_at !== null,
  };
}

/** Événement Stripe → événement utile : fin d'un paiement ou tout changement d'abonnement ; le reste est ignoré. */
export function toBillingEvent(event: Stripe.Event): BillingEvent {
  if (event.type === "checkout.session.completed") {
    return { id: event.id, type: event.type, subscriptionId: idOf(event.data.object.subscription) };
  }
  if (SUBSCRIPTION_EVENTS.has(event.type) && event.data.object.object === "subscription") {
    return { id: event.id, type: event.type, subscriptionId: event.data.object.id ?? null };
  }
  return { id: event.id, type: event.type, subscriptionId: null };
}

export function createStripeBilling(config: {
  secretKey: string;
  webhookSecret: string;
  prices: StripePrices;
}): BillingProvider {
  const stripe = new Stripe(config.secretKey, { timeout: REQUEST_TIMEOUT_MS, maxNetworkRetries: MAX_RETRIES });

  return {
    async createCheckout({ userId, email, plan, customerId, successUrl, cancelUrl }) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: plan === "yearly" ? config.prices.yearly : config.prices.monthly, quantity: 1 }],
        client_reference_id: userId,
        // Le webhook retrouve le compte par ces métadonnées, jamais par l'adresse email.
        subscription_data: { metadata: { userId } },
        ...(customerId ? { customer: customerId } : email ? { customer_email: email } : {}),
        locale: "fr",
        success_url: successUrl,
        cancel_url: cancelUrl,
      });
      if (!session.url) throw new Error("Stripe : session de paiement sans adresse");
      return session.url;
    },

    async createPortalSession({ customerId, returnUrl }) {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
        locale: "fr",
      });
      return session.url;
    },

    parseWebhook(rawBody, signature) {
      if (!signature) throw new InvalidSignatureError();
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(rawBody, signature, config.webhookSecret);
      } catch {
        throw new InvalidSignatureError();
      }
      return toBillingEvent(event);
    },

    async getSubscription(subscriptionId) {
      return toProviderSubscription(await stripe.subscriptions.retrieve(subscriptionId), config.prices);
    },

    async listInvoices(customerId) {
      const invoices = await stripe.invoices.list({ customer: customerId, limit: INVOICE_LIMIT });
      return invoices.data.flatMap((invoice): BillingInvoice[] =>
        invoice.id && invoice.status && SHOWN_INVOICE_STATUSES.has(invoice.status)
          ? [
              {
                id: invoice.id,
                number: invoice.number,
                createdAt: new Date(invoice.created * 1000),
                amountCents: invoice.total,
                currency: invoice.currency,
                status: invoice.status as BillingInvoice["status"],
                url: invoice.hosted_invoice_url ?? null,
              },
            ]
          : [],
      );
    },
  };
}

let provider: BillingProvider | null = null;

/** Paiement configuré : clé, secret du webhook et les deux prix. Sinon l'offre reste « bientôt disponible ». */
export function isBillingConfigured(): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_MONTHLY && env.STRIPE_PRICE_YEARLY,
  );
}

export function getBilling(): BillingProvider {
  const { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_YEARLY } = env;
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET || !STRIPE_PRICE_MONTHLY || !STRIPE_PRICE_YEARLY) {
    throw new Error("Stripe non configuré (voir .env.example)");
  }
  provider ??= createStripeBilling({
    secretKey: STRIPE_SECRET_KEY,
    webhookSecret: STRIPE_WEBHOOK_SECRET,
    prices: { monthly: STRIPE_PRICE_MONTHLY, yearly: STRIPE_PRICE_YEARLY },
  });
  return provider;
}
