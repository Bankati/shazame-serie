import { TitlePoster } from "@/components/identify/title-poster";
import { Badge } from "@/components/ui/badge";
import { ShareButton } from "@/components/share/share-button";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";
import { titlePath } from "@/lib/title-url";
import { TITLE_TEXT } from "@/content/fr/title";
import type { TitlePage } from "@/server/catalog/catalog-provider";

// En-tête de fiche (ui-context.md, « Fiche titre ») : bande sombre comme le hero, affiche et métadonnées.
export function TitleHeader({ page }: { page: TitlePage }) {
  const text = TITLE_TEXT;
  const duration =
    page.mediaType === "movie"
      ? page.runtimeMinutes
        ? text.runtime(page.runtimeMinutes)
        : null
      : [page.seasons ? text.seasons(page.seasons) : null, page.runtimeMinutes ? text.episodeRuntime(page.runtimeMinutes) : null]
          .filter(Boolean)
          .join(", ") || null;
  const facts = [page.year ? String(page.year) : null, text.kind[page.mediaType], duration].filter(Boolean).join(", ");

  return (
    <section aria-labelledby="titre-fiche" className="bg-inverse text-inverse-foreground">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:px-6 md:py-12">
        <TitlePoster title={page.title} year={page.year} posterPath={page.posterPath} size="w342" width={176} className="self-start" />
        <div className="flex min-w-0 flex-col gap-3">
          <h1 id="titre-fiche" className="font-display text-display-lg font-extrabold md:text-display-xl">
            {page.title}
          </h1>
          {page.originalTitle !== page.title ? <p className="text-base text-inverse-muted">{page.originalTitle}</p> : null}
          <p className="text-base text-inverse-muted">{facts}</p>
          {page.genres.length > 0 ? (
            <ul className="flex flex-wrap gap-2" aria-label="Genres">
              {page.genres.map((genre) => (
                <li key={genre}>
                  <Badge variant="secondary">{genre}</Badge>
                </li>
              ))}
            </ul>
          ) : null}
          {page.voteCount > 0 ? <p className="text-sm text-inverse-muted">{text.rating(page.voteAverage, page.voteCount)}</p> : null}
          {page.tagline ? <p className="max-w-prose text-lg text-inverse-foreground">«&nbsp;{page.tagline}&nbsp;»</p> : null}
          <div className="flex flex-wrap gap-2">
            <WatchlistButton item={{ tmdbId: page.tmdbId, mediaType: page.mediaType }} tone="inverse" />
            <ShareButton path={titlePath(page.mediaType, page.tmdbId, page.title)} title={page.title} tone="inverse" />
          </div>
          <dl className="flex flex-col gap-1 text-sm">
            {page.directors.length > 0 ? (
              <div className="flex gap-2">
                <dt className="text-inverse-muted">{text.credits[page.mediaType]}</dt>
                <dd>{page.directors.join(", ")}</dd>
              </div>
            ) : null}
            {page.writers.length > 0 ? (
              <div className="flex gap-2">
                <dt className="text-inverse-muted">{text.credits.writers}</dt>
                <dd>{page.writers.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>
    </section>
  );
}
