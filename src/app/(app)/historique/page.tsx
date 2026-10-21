import { History } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { type HistoryItem, HistoryList } from "@/components/history/history-list";
import { Button } from "@/components/ui/button";
import { HISTORY_TEXT } from "@/content/fr/history";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { formatParisDateTime } from "@/lib/paris-time";
import { requireUser } from "@/server/auth/guards";
import { loadAccountHistory } from "@/server/history/load-history";

export const metadata: Metadata = { title: HISTORY_TEXT.metaTitle, robots: { index: false } };

// Historique (U17) : session vérifiée avant toute lecture (invariant 7). Un compte suspendu garde l'accès
// à ses données ; un visiteur est envoyé vers la connexion, qui le ramène ici.
export default async function HistoryPage() {
  const access = await requireUser({ allowSuspended: true });
  if (!access.ok) {
    redirect("/connexion?suite=/historique");
  }

  const entries = await loadAccountHistory(access.account.id);
  const items: HistoryItem[] = entries.map((entry) => ({
    id: entry.id,
    tmdbId: entry.tmdbId,
    mediaType: entry.mediaType,
    confidence: entry.confidence,
    title: entry.title,
    year: entry.year,
    posterPath: entry.posterPath,
    identifiedOn: formatParisDateTime(new Date(entry.identifiedAt)),
  }));

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold md:text-display-lg">{HISTORY_TEXT.title}</h1>
        <p className="text-base text-muted-foreground">{HISTORY_TEXT.description}</p>
      </div>
      {items.length > 0 ? (
        <HistoryList items={items} />
      ) : (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-6 text-center md:p-10">
          <History className="size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-foreground">{HISTORY_TEXT.empty.title}</h2>
          <p className="max-w-prose text-sm text-muted-foreground">{HISTORY_TEXT.empty.description}</p>
          <Button asChild className="h-11 px-5 text-base hover:bg-primary-hover">
            <a href={LAYOUT_TEXT.nav.cta.href}>{HISTORY_TEXT.empty.cta}</a>
          </Button>
        </div>
      )}
    </div>
  );
}
