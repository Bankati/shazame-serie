import { History } from "lucide-react";
import Link from "next/link";

import { PosterRow } from "@/components/showcase/poster-row";
import type { PosterItem } from "@/components/showcase/poster-card";
import { APP_HOME_TEXT } from "@/content/fr/app-home";
import { getCurrentAccount } from "@/server/auth/guards";
import { loadAccountHistory } from "@/server/history/load-history";
import { log } from "@/server/log";
import { errorCode } from "@/server/log-error";

const RECENT_LIMIT = 10;

// « Vos identifications récentes » (U38) sous le panneau d'identification : compte connecté seulement (U17 : un
// visiteur n'a pas d'historique). Session vérifiée avant toute lecture (invariant 7) ; une panne n'empêche
// jamais d'identifier : la rangée disparaît simplement.
export async function RecentIdentifications() {
  const { recent } = APP_HOME_TEXT;
  const account = await getCurrentAccount();

  if (!account) {
    return (
      <p className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 text-sm text-muted-foreground sm:px-6">
        <History className="size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        <span>{recent.signedOut}</span>
        <Link
          href="/connexion?suite=/identifier"
          className="font-medium whitespace-nowrap text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
        >
          {recent.signIn}
        </Link>
      </p>
    );
  }

  let items: PosterItem[] = [];
  try {
    const entries = await loadAccountHistory(account.id, RECENT_LIMIT);
    items = entries
      .filter((entry) => entry.title !== null)
      .map((entry) => ({
        tmdbId: entry.tmdbId,
        mediaType: entry.mediaType,
        title: entry.title ?? "",
        year: entry.year,
        overview: "",
        posterPath: entry.posterPath,
        backdropPath: null,
        voteAverage: 0,
        genreIds: [],
        caption: recent.confidence(entry.confidence),
      }));
  } catch (error) {
    log.warn("identify.recent_unavailable", { code: errorCode(error) });
    return null;
  }
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <PosterRow id="recentes" title={recent.title} titles={items} />
      <Link
        href="/historique"
        className="mx-auto w-full max-w-6xl px-4 text-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring sm:px-6"
      >
        {recent.all}
      </Link>
    </div>
  );
}
