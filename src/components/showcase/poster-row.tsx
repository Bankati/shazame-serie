"use client";

import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { m } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { SHOWCASE_TEXT } from "@/content/fr/showcase";
import type { ShowcaseTitle } from "@/server/catalog/catalog-provider";

import { PosterCard } from "./poster-card";

const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } } as const;

// Rangée d'affiches à faire glisser (doigt, souris, flèches) : Embla en défilement libre. Les affiches
// apparaissent en cascade quand la rangée entre dans l'écran.
export function PosterRow({ id, title, titles }: { id: string; title: string; titles: readonly ShowcaseTitle[] }) {
  const [viewportRef, api] = useEmblaCarousel({ align: "start", dragFree: true, containScroll: "trimSnaps" });
  const [edges, setEdges] = useState({ previous: false, next: true });
  const { rows } = SHOWCASE_TEXT;

  const update = useCallback(() => {
    if (!api) return;
    setEdges({ previous: api.canScrollPrev(), next: api.canScrollNext() });
  }, [api]);

  useEffect(() => {
    if (!api) return;
    api.on("select", update).on("reInit", update).on("scroll", update);
    // L'événement « init » est déjà passé quand l'API arrive : premier état lu à l'image suivante.
    const frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      api.off("select", update).off("reInit", update).off("scroll", update);
    };
  }, [api, update]);

  if (titles.length === 0) {
    return null;
  }

  return (
    <section id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-20">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 sm:px-6">
        <h2 id={`${id}-titre`} className="font-display text-display font-bold">
          {title}
        </h2>
        <div className="hidden gap-2 md:flex">
          <RowButton label={rows.previous(title)} disabled={!edges.previous} onClick={() => api?.scrollPrev()}>
            <ChevronLeft className="size-5" aria-hidden="true" />
          </RowButton>
          <RowButton label={rows.next(title)} disabled={!edges.next} onClick={() => api?.scrollNext()}>
            <ChevronRight className="size-5" aria-hidden="true" />
          </RowButton>
        </div>
      </div>
      <div ref={viewportRef} className="mt-2 overflow-hidden">
        <m.ul
          className="mx-auto flex max-w-6xl gap-4 px-4 py-4 sm:px-6"
          variants={STAGGER}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
        >
          {titles.map((item) => (
            <li key={`${item.mediaType}-${item.tmdbId}`} className="shrink-0">
              <PosterCard title={item} />
            </li>
          ))}
        </m.ul>
      </div>
    </section>
  );
}

export function RowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant="outline" size="icon-lg" className="size-11 rounded-full" aria-label={label} disabled={disabled} onClick={onClick}>
      {children}
    </Button>
  );
}
