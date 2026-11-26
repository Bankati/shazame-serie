import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SubscriptionSyncForm } from "@/components/admin/subscription-sync-form";
import { Badge } from "@/components/ui/badge";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { formatMoney } from "@/lib/money";
import { formatParisDate, formatParisDateTime } from "@/lib/paris-time";
import { loadAdminUser } from "@/server/admin/users";
import type { BillingInvoice } from "@/server/billing/billing-provider";
import { isPremium } from "@/server/billing/premium-rule";
import { getBilling, isBillingConfigured } from "@/server/billing/stripe/stripe-billing";
import { loadSubscription } from "@/server/billing/subscriptions";
import { getDb } from "@/server/db/client";

import { subscriptionSyncAction } from "../../actions";
import { requireAdminPage } from "../../require-admin-page";

export const metadata: Metadata = { title: ADMIN_TEXT.user.metaTitle, robots: { index: false, follow: false } };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CARD = "flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground md:p-6";

/** Factures chez le prestataire ; null si momentanément indisponibles (le reste de la page s'affiche). */
async function loadInvoices(customerId: string): Promise<BillingInvoice[] | null> {
  try {
    return await getBilling().listInvoices(customerId);
  } catch {
    return null;
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="text-sm text-muted-foreground sm:w-56 sm:shrink-0">{label}</dt>
      <dd className="text-sm break-all">{children}</dd>
    </div>
  );
}

// Fiche d'un compte et de son abonnement (U26c, CDC 12.9) : consultation, et correction relue chez Stripe.
export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/utilisateurs/${encodeURIComponent(id)}`);
  if (!UUID.test(id)) notFound();
  const db = getDb();
  const [user, subscription] = await Promise.all([loadAdminUser(db, id), loadSubscription(db, id)]);
  if (!user) notFound();

  const configured = isBillingConfigured();
  const invoices = configured && subscription ? await loadInvoices(subscription.providerCustomerId) : [];
  const premium = isPremium(subscription, new Date());
  const text = ADMIN_TEXT.subscription;
  const users = ADMIN_TEXT.users;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <Link href="/admin/utilisateurs" className="self-start text-sm font-medium text-foreground underline underline-offset-4">
        {ADMIN_TEXT.user.back}
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="flex flex-wrap items-center gap-3 font-display text-display font-bold">
          {user.displayName || users.noName}
          {user.role === "admin" ? <Badge variant="secondary">{users.roleAdmin}</Badge> : null}
        </h1>
        <dl className="flex flex-col gap-2">
          <Row label={ADMIN_TEXT.user.email}>{user.email ?? users.noEmail}</Row>
          <Row label={ADMIN_TEXT.user.createdAt}>{formatParisDate(user.createdAt)}</Row>
          <Row label={ADMIN_TEXT.user.status}>
            <Badge variant={user.status === "suspended" ? "destructive" : "outline"}>{users.statuses[user.status]}</Badge>
          </Row>
        </dl>
      </div>

      <section className={CARD} aria-labelledby="abonnement">
        <h2 id="abonnement" className="text-base font-semibold">
          {text.title}
        </h2>
        {subscription ? (
          <dl className="flex flex-col gap-2">
            <Row label={text.plan}>{users.plans[subscription.plan]}</Row>
            <Row label={text.status}>{users.subscriptionStatus[subscription.status]}</Row>
            <Row label={text.periodEnd}>{formatParisDateTime(subscription.currentPeriodEnd)}</Row>
            <Row label={text.cancelAtPeriodEnd}>{subscription.cancelAtPeriodEnd ? text.yes : text.no}</Row>
            <Row label={text.premium}>
              <Badge variant={premium ? "default" : "outline"}>{premium ? text.yes : text.no}</Badge>
            </Row>
            <Row label={text.ids}>
              <span className="font-mono text-xs">
                {subscription.providerSubscriptionId}
                <br />
                {subscription.providerCustomerId}
              </span>
            </Row>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{text.none}</p>
        )}
      </section>

      {subscription ? (
        <section className={CARD} aria-labelledby="factures">
          <h2 id="factures" className="text-base font-semibold">
            {text.invoices}
          </h2>
          {invoices === null ? (
            <p className="text-sm text-muted-foreground">{text.invoicesUnavailable}</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{configured ? text.invoicesNone : text.notConfigured}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="flex flex-wrap items-baseline gap-x-3 text-sm">
                  <span className="tabular-nums">{formatParisDate(invoice.createdAt)}</span>
                  <span className="tabular-nums">{formatMoney(invoice.amountCents, invoice.currency)}</span>
                  <span className="text-muted-foreground">{text.invoiceStatus[invoice.status]}</span>
                  {invoice.url ? (
                    <a href={invoice.url} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                      {text.invoiceLink}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className={CARD} aria-labelledby="correction">
        <h2 id="correction" className="text-base font-semibold">
          {text.sync.title}
        </h2>
        <p className="text-sm text-muted-foreground">{text.sync.description}</p>
        {configured ? (
          <SubscriptionSyncForm action={subscriptionSyncAction} userId={user.id} />
        ) : (
          <p className="text-sm text-muted-foreground">{text.notConfigured}</p>
        )}
      </section>
    </div>
  );
}
