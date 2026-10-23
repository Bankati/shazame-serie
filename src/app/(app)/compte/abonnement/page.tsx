import { CircleAlert, Crown, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { ActivationWatcher } from "@/components/account/activation-watcher";
import { Button } from "@/components/ui/button";
import { SUBSCRIPTION_TEXT } from "@/content/fr/subscription";
import { formatMoney } from "@/lib/money";
import { formatParisDate } from "@/lib/paris-time";
import { requireUser } from "@/server/auth/guards";
import { loadSubscriptionPage } from "@/server/billing/billing-requests";
import { SUBSCRIPTION_PATH } from "@/shared/billing";

import { portalAction } from "./actions";

export const metadata: Metadata = { title: SUBSCRIPTION_TEXT.metaTitle, robots: { index: false } };

// Mon abonnement (U22, CDC 12.8) : offre, renouvellement ou fin, factures, et le portail Stripe pour la carte et
// la résiliation. Session vérifiée avant toute lecture (invariant 7) ; un compte suspendu peut gérer (résilier)
// son abonnement. `?statut=merci` : retour de la page de paiement, en attendant le webhook.
export default async function SubscriptionPage({ searchParams }: PageProps<"/compte/abonnement">) {
  const access = await requireUser({ allowSuspended: true });
  if (!access.ok) {
    redirect(`/connexion?suite=${encodeURIComponent(SUBSCRIPTION_PATH)}`);
  }
  const { statut, portail } = await searchParams;
  const { subscription, premium, invoices, configured } = await loadSubscriptionPage(access.account.id);
  const text = SUBSCRIPTION_TEXT;
  const until = subscription ? formatParisDate(subscription.currentPeriodEnd) : "";

  let statusLine: string | null = null;
  if (subscription && premium) {
    statusLine =
      subscription.status === "past_due"
        ? text.status.pastDue(until)
        : subscription.cancelAtPeriodEnd || subscription.status === "canceled"
          ? text.status.endsOn(until)
          : text.status.renews(until);
  } else if (subscription) {
    statusLine = text.status.ended(until);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold md:text-display-lg">{text.title}</h1>
        <p className="text-base text-muted-foreground">{text.description}</p>
      </div>

      {statut === "merci" ? (
        premium ? (
          <p
            role="status"
            className="rounded-lg border border-border bg-brand-subtle p-4 text-sm font-medium text-brand-subtle-foreground"
          >
            {text.welcome.done}
          </p>
        ) : (
          <ActivationWatcher />
        )
      ) : null}
      {portail === "indisponible" ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-border bg-card p-4 text-sm font-medium text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {text.portalUnavailable}
        </p>
      ) : null}

      <section
        aria-labelledby="offre-titre"
        className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:p-6"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-subtle">
            <Crown className="size-5 text-brand-strong" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <h2 id="offre-titre" className="text-lg font-semibold text-foreground">
              {premium && subscription ? text.plans[subscription.plan] : text.plans.free}
            </h2>
            <p className="text-sm text-muted-foreground">
              {premium && subscription ? text.prices[subscription.plan] : text.free.description}
            </p>
          </div>
        </div>
        {statusLine ? (
          <p
            className={
              subscription?.status === "past_due" && premium
                ? "text-sm font-medium text-warning"
                : "text-sm text-foreground"
            }
          >
            {statusLine}
          </p>
        ) : null}
        <div className="flex flex-col gap-2">
          {subscription && configured ? (
            <form action={portalAction} className="flex flex-col gap-2">
              <Button
                type="submit"
                variant={premium ? "outline" : "default"}
                className="h-11 w-full text-base sm:w-fit"
              >
                {text.manage}
              </Button>
              <p className="text-sm text-muted-foreground">{text.manageHint}</p>
            </form>
          ) : null}
          {!premium ? (
            <Button asChild className="h-11 w-full text-base hover:bg-primary-hover sm:w-fit">
              <Link href="/tarifs">{text.free.cta}</Link>
            </Button>
          ) : null}
        </div>
      </section>

      {subscription ? (
        <section
          aria-labelledby="factures-titre"
          className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:p-6"
        >
          <h2 id="factures-titre" className="text-lg font-semibold text-foreground">
            {text.invoices.title}
          </h2>
          {invoices === null ? (
            <p className="text-sm text-muted-foreground">{text.invoices.unavailable}</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">{text.invoices.empty}</p>
          ) : (
            <ul aria-label={text.invoices.caption} className="flex flex-col divide-y divide-border">
              {invoices.map((invoice) => (
                <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3">
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{formatParisDate(invoice.createdAt)}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatMoney(invoice.amountCents, invoice.currency)} · {text.invoices.status[invoice.status]}
                    </span>
                  </span>
                  {invoice.url ? (
                    <a
                      href={invoice.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={text.invoices.openLabel(invoice.number ?? "")}
                      className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      {text.invoices.open}
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
