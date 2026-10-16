import { TITLE_TEXT } from "@/content/fr/title";
import type { TitlePage } from "@/server/catalog/catalog-provider";

import { CastRow } from "./cast-row";
import { SimilarTitles } from "./similar-titles";
import { SourceAttribution } from "./source-attribution";
import { TitleHeader } from "./title-header";
import { TrailerPlayer } from "./trailer-player";
import { WatchProviders } from "./watch-providers";

// Fiche titre (ui-context.md) : en-tête, puis sections dans l'ordre fixe : Où regarder (U16) → Bande-annonce
// → Synopsis → Distribution → Titres similaires → Sources.
export function TitleView({ page }: { page: TitlePage }) {
  const { sections } = TITLE_TEXT;

  return (
    <article>
      <TitleHeader page={page} />
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 md:py-14">
        <Section id="ou-regarder" title={sections.watch}>
          <WatchProviders mediaType={page.mediaType} tmdbId={page.tmdbId} />
        </Section>
        {page.trailerKey ? (
          <Section id="bande-annonce" title={sections.trailer}>
            <div className="max-w-3xl">
              <TrailerPlayer youtubeKey={page.trailerKey} title={page.title} />
            </div>
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
