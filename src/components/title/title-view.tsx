import { TITLE_TEXT } from "@/content/fr/title";
import type { TitlePage } from "@/server/catalog/catalog-provider";

import { CastRow } from "./cast-row";
import { SimilarTitles } from "./similar-titles";
import { SourceAttribution } from "./source-attribution";
import { TitleHeader } from "./title-header";
import { TrailerPlayer } from "./trailer-player";
import { WatchProviders } from "./watch-providers";

// Fiche titre (ui-context.md ; deux colonnes depuis U40). Sur ordinateur : bande-annonce, synopsis et distribution à
// gauche ; « Où regarder » et « Détails » dans une colonne latérale qui reste visible au défilement. Sur mobile,
// l'ordre de la fiche est conservé : Où regarder → Bande-annonce → Synopsis → Distribution. Puis, sur toute la
// largeur : Titres similaires → Sources.
export function TitleView({ page }: { page: TitlePage }) {
  const { sections } = TITLE_TEXT;

  return (
    <article>
      <TitleHeader page={page} />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 md:py-14">
        <div className="grid gap-10 lg:grid-cols-3">
          <aside className="flex flex-col gap-6 lg:sticky lg:top-24 lg:order-2 lg:self-start">
            <Card id="ou-regarder" title={sections.watch}>
              <WatchProviders mediaType={page.mediaType} tmdbId={page.tmdbId} />
            </Card>
            <DetailsCard page={page} />
          </aside>
          <div className="flex min-w-0 flex-col gap-10 lg:order-1 lg:col-span-2">
            {page.trailerKey ? (
              <Section id="bande-annonce" title={sections.trailer}>
                <TrailerPlayer youtubeKey={page.trailerKey} title={page.title} />
              </Section>
            ) : null}
            <Section id="synopsis" title={sections.synopsis}>
              <p className="max-w-prose text-base text-foreground md:text-lg">{page.overview || TITLE_TEXT.noOverview}</p>
            </Section>
            {page.cast.length > 0 ? (
              <Section id="distribution" title={sections.cast}>
                <CastRow cast={page.cast} />
              </Section>
            ) : null}
          </div>
        </div>
        {page.similar.length > 0 ? (
          <Section id="similaires" title={sections.similar}>
            <SimilarTitles titles={page.similar} />
          </Section>
        ) : null}
        <Section id="sources" title={sections.sources}>
          <SourceAttribution />
        </Section>
      </div>
    </article>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="font-display text-display font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** Carte de la colonne latérale : titre plus discret que les sections principales. */
function Card({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <h2 id={id} className="font-display text-xl font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

type DetailRow = { label: string; value: string };

function DetailsCard({ page }: { page: TitlePage }) {
  const { details, kind } = TITLE_TEXT;
  const rows: (DetailRow | null)[] = [
    { label: details.type, value: kind[page.mediaType] },
    page.originalTitle && page.originalTitle !== page.title ? { label: details.originalTitle, value: page.originalTitle } : null,
    page.directors.length > 0 ? { label: details.directors[page.mediaType], value: page.directors.join(", ") } : null,
    page.writers.length > 0 ? { label: details.writers, value: page.writers.join(", ") } : null,
    page.voteCount > 0 ? { label: details.rating, value: details.ratingValue(page.voteAverage, page.voteCount) } : null,
  ];

  return (
    <Card id="details" title={details.title}>
      {page.genres.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label={TITLE_TEXT.genresLabel}>
          {page.genres.map((genre) => (
            <li key={genre} className="rounded-sm border border-border px-2.5 py-1 text-sm text-muted-foreground">
              {genre}
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="flex flex-col gap-3 text-sm">
        {rows.filter((row) => row !== null).map((row) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-foreground">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
