"use client";

import { m } from "motion/react";
import Image from "next/image";
import Link from "next/link";

import { SHOWCASE_TEXT } from "@/content/fr/showcase";
import { titlePath } from "@/lib/title-url";
import { posterUrl } from "@/lib/tmdb-image";
import type { ShowcaseTitle } from "@/server/catalog/catalog-provider";

import { StarRating } from "./star-rating";

/** Variantes d'apparition d'une affiche dans une rangée (cascade pilotée par la rangée). */
export const POSTER_CARD_ITEM = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
} as const;

// Affiche cliquable : soulevée et agrandie au survol, lien vers la fiche du titre.
export function PosterCard({ title }: { title: ShowcaseTitle }) {
  const src = posterUrl(title.posterPath, "w342");
  return (
    <m.div variants={POSTER_CARD_ITEM} whileHover={{ y: -8, scale: 1.04 }} transition={{ type: "spring", stiffness: 300, damping: 22 }}>
      <Link
        href={titlePath(title.mediaType, title.tmdbId, title.title)}
        className="group flex w-32 flex-col gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring md:w-40"
      >
        <span className="relative block aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-lg ring-1 ring-border transition-shadow group-hover:ring-2 group-hover:ring-link">
          {src ? (
            <Image
              src={src}
              alt={SHOWCASE_TEXT.posterAlt(title.title, title.year)}
              fill
              sizes="(min-width: 768px) 160px, 128px"
              unoptimized
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : null}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="truncate text-sm font-semibold text-foreground">{title.title}</span>
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            {title.year ? <span>{title.year}</span> : null}
            <StarRating voteAverage={title.voteAverage} />
          </span>
        </span>
      </Link>
    </m.div>
  );
}
