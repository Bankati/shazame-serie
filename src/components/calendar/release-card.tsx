import { CalendarDays, Film } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { WatchlistButton } from "@/components/watchlist/watchlist-button";
import { CALENDAR_TEXT } from "@/content/fr/calendar";
import { formatReleaseDay } from "@/lib/release-calendar";
import { titlePath } from "@/lib/title-url";
import { posterUrl } from "@/lib/tmdb-image";
import type { ReleaseTitle } from "@/server/catalog/catalog-provider";

// Carte du calendrier (U42) : affiche, type, date de sortie (ou de première diffusion), résumé court, lien vers
// la fiche et ajout à la liste. L'affiche et le titre mènent tous deux à la fiche.
export function ReleaseCard({ title }: { title: ReleaseTitle }) {
  const text = CALENDAR_TEXT;
  const src = posterUrl(title.posterPath, "w185");
  const href = titlePath(title.mediaType, title.tmdbId, title.title);
  const date = title.releaseDate ? text.date[title.mediaType](formatReleaseDay(title.releaseDate)) : text.date.unknown;

  return (
    <article className="flex gap-4 rounded-lg border border-border bg-card p-3 md:p-4">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[2/3] w-24 shrink-0 overflow-hidden rounded-poster bg-muted md:w-28"
      >
        {src ? (
          <Image src={src} alt={text.posterAlt(title.title)} fill sizes="112px" unoptimized className="object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center">
            <Film className="size-8 text-muted-foreground" aria-hidden="true" />
          </span>
        )}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="w-fit rounded-sm bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          {text.kind[title.mediaType]}
        </span>
        <h3 className="font-display text-lg font-bold leading-tight text-foreground">
          <Link
            href={href}
            className="rounded-sm hover:text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {title.title}
          </Link>
        </h3>
        <p className="flex items-center gap-2 text-sm font-medium text-brand-strong">
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          {date}
        </p>
        {title.overview ? <p className="line-clamp-3 text-sm text-muted-foreground">{title.overview}</p> : null}
        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <WatchlistButton item={{ tmdbId: title.tmdbId, mediaType: title.mediaType }} className="h-11 px-3 text-sm" />
          <Link
            href={href}
            aria-label={text.detailsLabel(title.title)}
            className="inline-flex h-11 items-center rounded-md px-3 text-sm font-medium text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {text.details}
          </Link>
        </div>
      </div>
    </article>
  );
}
