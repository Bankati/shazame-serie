"use client";

import { m } from "motion/react";
import Link from "next/link";

import { ConfidenceBadge } from "@/components/identify/confidence-badge";
import { TitlePoster } from "@/components/identify/title-poster";
import { HISTORY_TEXT } from "@/content/fr/history";
import { titlePath } from "@/lib/title-url";
import type { MediaType } from "@/server/catalog/catalog-provider";

export type HistoryItem = {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  confidence: number;
  title: string | null;
  year: number | null;
  posterPath: string | null;
  /** Date déjà formatée en heure de Paris par le serveur. */
  identifiedOn: string;
};

const LIST = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } } as const;
const ITEM = {
  hidden: { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
} as const;
const POSTER_WIDTH = 56;

// Historique (U17) : une ligne par identification, plus récente en haut. Chaque ligne rouvre la fiche
// (CDC 12.5). Lignes qui apparaissent en cascade.
export function HistoryList({ items }: { items: readonly HistoryItem[] }) {
  return (
    <m.ol className="flex flex-col gap-3" variants={LIST} initial="hidden" animate="visible">
      {items.map((item) => {
        const name = item.title ?? HISTORY_TEXT.unavailable;
        return (
          <m.li key={item.id} variants={ITEM}>
            <Link
              href={titlePath(item.mediaType, item.tmdbId, item.title ?? "titre")}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:p-4"
            >
              <TitlePoster title={name} year={item.year} posterPath={item.posterPath} size="w92" width={POSTER_WIDTH} />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="truncate font-display text-lg font-bold text-foreground group-hover:text-link">{name}</span>
                <span className="text-sm text-muted-foreground">
                  {[HISTORY_TEXT.kind[item.mediaType], item.year].filter(Boolean).join(", ")}
                </span>
                <span className="text-sm text-muted-foreground">{HISTORY_TEXT.identifiedOn(item.identifiedOn)}</span>
                {/* Confiance toujours affichée (CDC 12.5) : sous la date sur mobile, à droite au-delà. */}
                <div className="sm:hidden">
                  <ConfidenceBadge confidence={item.confidence} />
                </div>
              </div>
              <div className="hidden shrink-0 sm:block">
                <ConfidenceBadge confidence={item.confidence} />
              </div>
            </Link>
          </m.li>
        );
      })}
    </m.ol>
  );
}
