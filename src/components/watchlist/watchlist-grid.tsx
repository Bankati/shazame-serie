"use client";

import { Film, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { toggleWatchlist, useWatchlist } from "@/client/watchlist/watchlist";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { WATCHLIST_TEXT } from "@/content/fr/watchlist";
import { titlePath } from "@/lib/title-url";
import { posterUrl } from "@/lib/tmdb-image";
import { watchlistKey } from "@/schemas/watchlist";
import type { MediaType } from "@/server/catalog/catalog-provider";

export type WatchlistGridItem = {
  tmdbId: number;
  mediaType: MediaType;
  title: string | null;
  year: number | null;
  posterPath: string | null;
};

// Page « Ma liste » (U18) : grille d'affiches, retrait animé (la grille se recompose). Le compteur suit l'état
// partagé de la liste ; une affiche retirée disparaît tout de suite et revient si le serveur refuse.
export function WatchlistGrid({ items, limit }: { items: readonly WatchlistGridItem[]; limit: number | null }) {
  const state = useWatchlist();
  const [removing, setRemoving] = useState<string | null>(null);
  const text = WATCHLIST_TEXT.page;
  // Avant le chargement de l'état partagé, on affiche ce que le serveur a rendu.
  const visible = state.status === "ready" ? items.filter((item) => state.keys.has(watchlistKey(item))) : items;
  const count = state.status === "ready" ? state.count : items.length;

  const remove = async (item: WatchlistGridItem) => {
    setRemoving(watchlistKey(item));
    const result = await toggleWatchlist({ tmdbId: item.tmdbId, mediaType: item.mediaType });
    setRemoving(null);
    if (!result.ok) toast.error(WATCHLIST_TEXT.failures[result.reason]);
  };

  if (visible.length === 0) {
    return <EmptyWatchlist />;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-muted-foreground" aria-live="polite">
        {text.count(count, state.status === "ready" ? state.limit : limit)}
      </p>
      <m.ul layout className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((item) => {
            const key = watchlistKey(item);
            const name = item.title ?? text.unavailable;
            const src = posterUrl(item.posterPath, "w342");
            return (
              <m.li
                key={key}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-2"
              >
                <Link
                  href={titlePath(item.mediaType, item.tmdbId, item.title ?? "titre")}
                  className="group flex flex-col gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <span className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-muted ring-1 ring-border transition-shadow group-hover:ring-2 group-hover:ring-link">
                    {src ? (
                      <Image src={src} alt={text.posterAlt(name)} fill sizes="(min-width: 768px) 25vw, 50vw" unoptimized className="object-cover" />
                    ) : (
                      <span className="flex h-full items-center justify-center">
                        <Film className="size-8 text-muted-foreground" aria-hidden="true" />
                      </span>
                    )}
                  </span>
                  <span className="truncate text-sm font-semibold text-foreground">{name}</span>
                  {item.year ? <span className="-mt-1 text-sm text-muted-foreground">{item.year}</span> : null}
                </Link>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 gap-2 text-sm"
                  // Actif seulement quand l'état partagé est chargé (sinon le retrait serait refusé).
                  disabled={state.status !== "ready" || removing === key}
                  onClick={() => remove(item)}
                >
                  <X className="size-4" aria-hidden="true" />
                  {text.remove}
                  <span className="sr-only">{name}</span>
                </Button>
              </m.li>
            );
          })}
        </AnimatePresence>
      </m.ul>
    </div>
  );
}

function EmptyWatchlist() {
  const { empty } = WATCHLIST_TEXT.page;
  return (
    <EmptyState icon={Film} title={empty.title} description={empty.description} action={{ href: LAYOUT_TEXT.nav.cta.href, label: empty.cta }} />
  );
}
