"use client";

import { AnimatePresence, m } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { SHOWCASE_TEXT } from "@/content/fr/showcase";
import { cn } from "@/lib/utils";
import type { ShowcaseTitle } from "@/server/catalog/catalog-provider";
import type { GenreTile } from "@/server/catalog/home-showcase";

import { PosterCard } from "./poster-card";

const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";
const MAX_RESULTS = 12;

// « Explorer par genre » : tuiles de genres (image d'un film du genre), puis la grille des films du genre
// choisi, qui se recompose en douceur (animations de mise en page de Motion).
export function GenreExplorer({ genres, titles }: { genres: readonly GenreTile[]; titles: readonly ShowcaseTitle[] }) {
  const [selected, setSelected] = useState(genres[0]?.id ?? null);
  const { genres: text } = SHOWCASE_TEXT;
  const current = genres.find((genre) => genre.id === selected);
  if (!current) {
    return null;
  }
  const results = titles.filter((title) => title.genreIds.includes(current.id)).slice(0, MAX_RESULTS);

  return (
    <section id="genres" aria-labelledby="genres-titre" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-6 px-4 sm:px-6">
      <div className="flex flex-col gap-2">
        <h2 id="genres-titre" className="font-display text-display font-bold">
          {text.title}
        </h2>
        <p className="text-base text-muted-foreground">{text.subtitle}</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {genres.map((genre, index) => {
          const active = genre.id === current.id;
          return (
            <m.li
              key={genre.id}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.4 }}
            >
              <m.button
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(genre.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  "relative flex h-20 w-full items-center justify-center overflow-hidden rounded-lg text-base font-bold text-inverse-foreground ring-1 ring-border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:h-24 md:text-lg",
                  active && "ring-2 ring-link",
                )}
              >
                {genre.backdropPath ? (
                  <Image src={`${BACKDROP_BASE}${genre.backdropPath}`} alt="" fill sizes="(min-width: 640px) 25vw, 50vw" unoptimized className="object-cover" />
                ) : null}
                <span aria-hidden="true" className={cn("absolute inset-0 bg-inverse/70 transition-colors", active && "bg-inverse/40")} />
                <span className="relative flex flex-col items-center">
                  {genre.name}
                  <span className="text-sm font-medium text-inverse-muted">{text.count(genre.count)}</span>
                </span>
              </m.button>
            </m.li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-3">
        {/* Seul le titre est annoncé au changement de genre, pas les douze affiches. */}
        <h3 aria-live="polite" className="text-lg font-semibold text-foreground">
          {text.results(current.name)}
        </h3>
        <m.ul layout className="flex flex-wrap gap-4">
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((title) => (
              <m.li
                key={`${title.mediaType}-${title.tmdbId}`}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.3 }}
              >
                <PosterCard title={title} />
              </m.li>
            ))}
          </AnimatePresence>
        </m.ul>
      </div>
    </section>
  );
}
