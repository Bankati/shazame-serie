import "server-only";

import { z } from "zod";

import { siteUrl } from "@/lib/site-url";
import { type Account, getCurrentAccount } from "@/server/auth/guards";
import { getDb } from "@/server/db/client";
import { buildLimiter } from "@/server/http/attempt-limiter";
import { jsonError, jsonOk } from "@/server/http/respond";
import { log } from "@/server/log";
import { errorCode } from "@/server/log-error";
import { SUBSCRIPTION_PATH } from "@/shared/billing";

import {
  type BillingEvent,
  type BillingInvoice,
  type BillingPlan,
  type BillingProvider,
  InvalidSignatureError,
  type ProviderSubscription,
} from "./billing-provider";
import { isPremium } from "./entitlement";
import { getBilling, isBillingConfigured } from "./stripe/stripe-billing";
import { type ApplyOutcome, applyBillingEvent, loadSubscription, type SubscriptionRow } from "./subscriptions";

// Paiement Premium (U22, CDC 12.8 et 13.3). Ordre fixe (code-standards.md) : validation, session, puis action
// sur le seul compte de la session. Le statut Premium n'est jamais modifié ici : seul le webhook l'écrit.

const PROVIDER = "stripe";
const CHECKOUTS_PER_HOUR = 10;

const planSchema = z.enum(["monthly", "yearly"]);

export type BillingDeps = {
  configured: () => boolean;
  provider: () => BillingProvider;
  account: () => Promise<Account | null>;
  subscription: (userId: string) => Promise<SubscriptionRow | null>;
  apply: (event: BillingEvent, subscription: ProviderSubscription | null) => Promise<ApplyOutcome>;
  allowCheckout: (userId: string) => Promise<boolean>;
  now: () => Date;
};

let checkoutLimiter: ReturnType<typeof buildLimiter> | undefined;

export function billingDeps(): BillingDeps {
  return {
    configured: isBillingConfigured,
    provider: getBilling,
    account: getCurrentAccount,
    subscription: (userId) => loadSubscription(getDb(), userId),
    apply: (event, subscription) => applyBillingEvent(getDb(), event, subscription, PROVIDER),
    allowCheckout: async (userId) => {
      checkoutLimiter ??= buildLimiter("billing:checkout", CHECKOUTS_PER_HOUR);
      return (await checkoutLimiter.consume(userId)).ok;
    },
    now: () => new Date(),
  };
}

/** Où envoyer le navigateur : page de paiement, portail, connexion, ou retour avec un motif d'échec. */
export type BillingRedirect = { to: string };

/**
 * Bouton « S'abonner » (/tarifs). Visiteur : inscription puis retour aux tarifs. Déjà Premium : portail (pas de
 * second abonnement). Compte suspendu : refusé. Échec du prestataire : retour aux tarifs avec un motif.
 */
export async function startCheckout(form: FormData, deps: BillingDeps = billingDeps()): Promise<BillingRedirect> {
  const plan = planSchema.safeParse(form.get("plan"));
  if (!plan.success || !deps.configured()) return { to: "/tarifs?paiement=indisponible" };

  const account = await deps.account();
  if (!account) return { to: `/inscription?suite=${encodeURIComponent("/tarifs")}` };
  if (account.status === "suspended") return { to: "/tarifs?paiement=refuse" };

  try {
    const current = await deps.subscription(account.id);
    if (isPremium(current, deps.now())) return { to: SUBSCRIPTION_PATH };
    if (!(await deps.allowCheckout(account.id))) return { to: "/tarifs?paiement=trop" };
    const url = await deps.provider().createCheckout({
      userId: account.id,
      email: account.email,
      plan: plan.data satisfies BillingPlan,
      // Ancien client (abonnement terminé) : réutilisé, ses factures restent au même endroit.
      customerId: current?.providerCustomerId ?? null,
      successUrl: `${siteUrl()}${SUBSCRIPTION_PATH}?statut=merci`,
      cancelUrl: `${siteUrl()}/tarifs`,
    });
    return { to: url };
  } catch (error) {
    log.error("billing.checkout_failed", { code: errorCode(error) });
    return { to: "/tarifs?paiement=indisponible" };
  }
}

/** Bouton « Gérer mon abonnement » : portail du prestataire (carte, factures, résiliation). Suspendu : permis. */
export async function openPortal(deps: BillingDeps = billingDeps()): Promise<BillingRedirect> {
  const account = await deps.account();
  if (!account) return { to: `/connexion?suite=${encodeURIComponent(SUBSCRIPTION_PATH)}` };
  if (!deps.configured()) return { to: `${SUBSCRIPTION_PATH}?portail=indisponible` };
  try {
    const current = await deps.subscription(account.id);
    if (!current) return { to: "/tarifs" };
    const url = await deps
      .provider()
      .createPortalSession({ customerId: current.providerCustomerId, returnUrl: `${siteUrl()}${SUBSCRIPTION_PATH}` });
    return { to: url };
  } catch (error) {
    log.error("billing.portal_failed", { code: errorCode(error) });
    return { to: `${SUBSCRIPTION_PATH}?portail=indisponible` };
  }
}

/**
 * POST /api/billing/webhook. Corps brut et signature vérifiée (invariant 5) ; l'abonnement est relu chez le
 * prestataire (ordre des événements non garanti). Réponses : 400 signature invalide, 500 prestataire ou base
 * injoignable (le prestataire réessaiera), 200 sinon (y compris événement rejoué ou sans intérêt).
 */
export async function handleBillingWebhook(request: Request, deps: BillingDeps = billingDeps()): Promise<Response> {
  if (!deps.configured()) return jsonError("UPSTREAM_ERROR");
  const rawBody = await request.text();

  let event: BillingEvent;
  try {
    event = deps.provider().parseWebhook(rawBody, request.headers.get("stripe-signature"));
  } catch (error) {
    if (error instanceof InvalidSignatureError) {
      log.warn("billing.webhook_invalid_signature");
      return jsonError("VALIDATION_ERROR");
    }
    throw error;
  }
  if (!event.subscriptionId) return jsonOk({ received: true });

  let subscription: ProviderSubscription;
  try {
    subscription = await deps.provider().getSubscription(event.subscriptionId);
  } catch (error) {
    log.error("billing.subscription_fetch_failed", { type: event.type, code: errorCode(error) });
    return jsonError("UPSTREAM_ERROR");
  }

  try {
    const outcome = await deps.apply(event, subscription);
    if (outcome === "ignored")
      log.warn("billing.webhook_ignored", { type: event.type, status: subscription.status ?? "none" });
    return jsonOk({ received: true, outcome });
  } catch (error) {
    log.error("billing.webhook_apply_failed", { type: event.type, code: errorCode(error) });
    return jsonError("UPSTREAM_ERROR");
  }
}

export type SubscriptionPage = {
  subscription: SubscriptionRow | null;
  premium: boolean;
  /** null : factures momentanément indisponibles (le reste de la page s'affiche). */
  invoices: BillingInvoice[] | null;
  configured: boolean;
};

/** Page « Mon abonnement » du compte de la session. */
export async function loadSubscriptionPage(
  userId: string,
  deps: BillingDeps = billingDeps(),
): Promise<SubscriptionPage> {
  const subscription = await deps.subscription(userId);
  const configured = deps.configured();
  let invoices: BillingInvoice[] | null = [];
  if (subscription && configured) {
    try {
      invoices = await deps.provider().listInvoices(subscription.providerCustomerId);
    } catch (error) {
      log.warn("billing.invoices_unavailable", { code: errorCode(error) });
      invoices = null;
    }
  }
  return { subscription, premium: isPremium(subscription, deps.now()), invoices, configured };
}
