"use client";

import { CalendarDays, Crown, History, Bookmark } from "lucide-react";
import Link from "next/link";

import { useAccount } from "@/client/account/account";
import { CALENDAR_PATH } from "@/components/layout/app-nav";
import { HISTORY_PATH, WATCHLIST_PATH } from "@/components/layout/account-menu";
import { Button } from "@/components/ui/button";
import { PRICING_TEXT } from "@/content/fr/pricing";
import type { QuotaInfo } from "@/schemas/identify";

// Paywall (U21, CDC 12.8) : affiché dans le panneau d'identification quand le quota du jour est épuisé. Il invite
// selon le profil : un visiteur à créer un compte gratuit, un compte gratuit à découvrir Premium ; un Premium est
// seulement prévenu. Il ne bloque rien d'autre : fiches, calendrier, historique et liste restent ouverts.
export function Paywall({ quota }: { quota: QuotaInfo }) {
  const account = useAccount();
  const signedIn = account.status === "ready" && account.account !== null;
  // Profil fourni par le serveur ; à défaut, déduit de la session.
  const plan = quota.plan ?? (signedIn ? "free" : "visitor");
  const { paywall } = PRICING_TEXT;
  const link =
    "inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-link hover:underline focus-visible:outline-2 focus-visible:outline-ring";

  return (
    <section
      aria-labelledby="paywall-title"
      className="flex flex-col gap-4 rounded-xl border-2 border-primary bg-brand-subtle p-4 md:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Crown className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="paywall-title" className="font-display text-xl font-bold text-foreground">
            {plan === "premium" ? paywall.premium.title : paywall[plan].title(quota.limit)}
          </h2>
          <p className="text-base text-brand-subtle-foreground">
            {plan === "premium" ? paywall.premium.description(quota.limit) : paywall[plan].description}
          </p>
          <p className="text-sm text-muted-foreground">{paywall.reset}</p>
        </div>
      </div>

      {plan === "visitor" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="h-11 px-5 text-base hover:bg-primary-hover">
            <Link href={`/inscription?suite=${encodeURIComponent("/identifier")}`}>{paywall.visitor.primary}</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 px-5 text-base">
            <Link href="/tarifs">{paywall.visitor.secondary}</Link>
          </Button>
        </div>
      ) : plan === "free" ? (
        <Button asChild className="h-11 w-full px-5 text-base hover:bg-primary-hover sm:w-fit">
          <Link href="/tarifs">{paywall.free.primary}</Link>
        </Button>
      ) : null}

      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{paywall.browse}</p>
        <ul className="flex flex-wrap gap-x-2">
          <li>
            <Link href={CALENDAR_PATH} className={link}>
              <CalendarDays className="size-4" aria-hidden="true" />
              {paywall.links.calendar}
            </Link>
          </li>
          {signedIn ? (
            <>
              <li>
                <Link href={HISTORY_PATH} className={link}>
                  <History className="size-4" aria-hidden="true" />
                  {paywall.links.history}
                </Link>
              </li>
              <li>
                <Link href={WATCHLIST_PATH} className={link}>
                  <Bookmark className="size-4" aria-hidden="true" />
                  {paywall.links.watchlist}
                </Link>
              </li>
            </>
          ) : null}
        </ul>
      </div>
    </section>
  );
}
