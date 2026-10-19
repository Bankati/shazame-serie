import Link from "next/link";

import { TitlePoster } from "@/components/identify/title-poster";
import { TITLE_TEXT } from "@/content/fr/title";
import { titlePath } from "@/lib/title-url";
import type { SimilarTitle } from "@/server/catalog/catalog-provider";

// Titres similaires avec leur motif (CDC 12.6) : chaque carte mène à la fiche du titre.
export function SimilarTitles({ titles }: { titles: readonly SimilarTitle[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {titles.map((title) => (
        <li key={`${title.mediaType}-${title.tmdbId}`}>
          <PosterCard title={title} />
        </li>
      ))}
    </ul>
  );
}

function PosterCard({ title }: { title: SimilarTitle }) {
  return (
    <Link
      href={titlePath(title.mediaType, title.tmdbId, title.title)}
      className="group flex flex-col gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <TitlePoster title={title.title} year={title.year} posterPath={title.posterPath} size="w342" width={160} className="h-auto w-full" />
      <span className="text-sm font-medium text-foreground group-hover:underline">
        {title.title}
        {title.year ? ` (${title.year})` : ""}
      </span>
      <span className="text-sm text-muted-foreground">{TITLE_TEXT.reason(title.reason)}</span>
    </Link>
  );
}
