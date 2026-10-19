import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WatchlistGrid } from "@/components/watchlist/watchlist-grid";
import { WATCHLIST_TEXT } from "@/content/fr/watchlist";
import { requireUser } from "@/server/auth/guards";
import { loadAccountWatchlist } from "@/server/watchlist/load-watchlist";

export const metadata: Metadata = { title: WATCHLIST_TEXT.page.metaTitle, robots: { index: false } };

// Ma liste (U18) : session vérifiée avant toute lecture (invariant 7). Compte suspendu : lecture seule
// (le retrait est refusé par l'API) ; visiteur : connexion, puis retour ici.
export default async function WatchlistPage() {
  const access = await requireUser({ allowSuspended: true });
  if (!access.ok) {
    redirect("/connexion?suite=/ma-liste");
  }
  const { entries, limit } = await loadAccountWatchlist(access.account.id);
  const { page } = WATCHLIST_TEXT;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold md:text-display-lg">{page.title}</h1>
        <p className="text-base text-muted-foreground">{page.description}</p>
      </div>
      <WatchlistGrid items={entries} limit={limit} />
    </div>
  );
}
