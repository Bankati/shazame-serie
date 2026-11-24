"use client";

import { Check, Plus } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { toggleWatchlist, useWatchlist } from "@/client/watchlist/watchlist";
import { Button } from "@/components/ui/button";
import { WATCHLIST_TEXT } from "@/content/fr/watchlist";
import { cn } from "@/lib/utils";
import { type WatchlistItem, watchlistKey } from "@/schemas/watchlist";

// « Ajouter à ma liste » / « Dans ma liste » (U18, ui-context.md : action secondaire du résultat et de la
// fiche). Optimiste : l'état change au clic, puis revient en arrière avec un message si le serveur refuse.
// Visiteur : lien vers la connexion, qui ramène sur la page courante.
export function WatchlistButton({
  item,
  tone = "default",
  className,
}: {
  item: WatchlistItem;
  /** `inverse` sur les surfaces sombres (en-tête de fiche). */
  tone?: "default" | "inverse";
  className?: string;
}) {
  const state = useWatchlist();
  const pathname = usePathname();
  const [pending, setPending] = useState(false);
  const text = WATCHLIST_TEXT;
  const base = cn("h-11 gap-2 px-4 text-base", tone === "inverse" && "border-inverse-foreground/40 bg-transparent text-inverse-foreground", className);

  if (state.status === "visitor") {
    return (
      <Button asChild variant="outline" className={base}>
        <Link href={`/connexion?suite=${encodeURIComponent(pathname)}`} title={text.signIn}>
          <Plus className="size-5" aria-hidden="true" />
          {text.add}
        </Link>
      </Button>
    );
  }

  const inList = state.status === "ready" && state.keys.has(watchlistKey(item));
  const onClick = async () => {
    setPending(true);
    const result = await toggleWatchlist(item);
    setPending(false);
    if (!result.ok) toast.error(text.failures[result.reason]);
  };

  return (
    <Button
      type="button"
      variant="outline"
      // Le nom accessible reste le texte visible (WCAG 2.5.3) ; l'état est porté par aria-pressed.
      aria-pressed={inList}
      disabled={state.status !== "ready" || pending}
      onClick={onClick}
      className={cn(base, inList && (tone === "inverse" ? "border-brand-light text-brand-light" : "border-brand-strong text-brand-strong"))}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={inList ? "in" : "out"}
          initial={{ scale: 0.4, rotate: -90, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          exit={{ scale: 0.4, rotate: 90, opacity: 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 28 }}
          className="flex"
          aria-hidden="true"
        >
          {inList ? <Check className="size-5" /> : <Plus className="size-5" />}
        </m.span>
      </AnimatePresence>
      {inList ? text.added : text.add}
    </Button>
  );
}
