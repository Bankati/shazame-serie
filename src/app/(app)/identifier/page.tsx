import type { Metadata } from "next";
import { Suspense } from "react";

import { IdentifyPanel } from "@/components/identify/identify-panel";
import type { IdentifyTab } from "@/components/identify/identify-tabs";
import { RecentIdentifications } from "@/components/identify/recent-identifications";
import { TwoTone } from "@/components/layout/two-tone";
import { PosterRow } from "@/components/showcase/poster-row";
import { ShowcaseBoundary } from "@/components/showcase/showcase-boundary";
import { APP_HOME_TEXT } from "@/content/fr/app-home";
import { SHOWCASE_TEXT } from "@/content/fr/showcase";
import { loadHomeShowcase } from "@/server/catalog/home-showcase";
import { getStaticPageCatalog, isCatalogConfigured } from "@/server/catalog/tmdb/tmdb-catalog";

export const metadata: Metadata = { title: APP_HOME_TEXT.metaTitle };

const TABS: readonly IdentifyTab[] = ["media", "description", "link"];

// Page d'identification de l'application (U38, AD-46) : le panneau en premier, puis les identifications récentes
// du compte et les tendances. `?mode=` et `?lien=` viennent du lanceur de la vitrine.
export default async function IdentifyPage({ searchParams }: PageProps<"/identifier">) {
  const params = await searchParams;
  const mode = typeof params.mode === "string" && (TABS as readonly string[]).includes(params.mode) ? (params.mode as IdentifyTab) : undefined;
  const link = typeof params.lien === "string" && params.lien.trim() !== "" ? params.lien : undefined;
  const showcase = await loadHomeShowcase(getStaticPageCatalog, { configured: isCatalogConfigured() }).catch(() => null);
  const { rows } = SHOWCASE_TEXT;

  return (
    <div className="flex flex-col gap-12 pb-12 md:gap-16 md:pb-16">
      <section aria-labelledby="identify-title" className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-8 sm:px-6 md:pt-12">
        <div className="flex flex-col gap-2 text-center">
          <h1 id="identify-title" className="font-display text-display font-extrabold md:text-display-lg">
            <TwoTone text={APP_HOME_TEXT.title} highlight={APP_HOME_TEXT.highlight} />
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">{APP_HOME_TEXT.subtitle}</p>
        </div>
        <IdentifyPanel initialTab={link ? "link" : mode} initialLink={link} />
      </section>
      <Suspense fallback={null}>
        <RecentIdentifications />
      </Suspense>
      {showcase ? (
        <ShowcaseBoundary fallback={null}>
          <PosterRow id="tendances" title={rows.trendingMovies} titles={showcase.trendingMovies} />
          <PosterRow id="series" title={rows.trendingShows} titles={showcase.trendingShows} />
          <p className="mx-auto w-full max-w-6xl px-4 text-sm text-muted-foreground sm:px-6">{SHOWCASE_TEXT.source}</p>
        </ShowcaseBoundary>
      ) : null}
    </div>
  );
}
