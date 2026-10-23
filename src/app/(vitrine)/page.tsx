import { demoTitleFrom, filmStripImages } from "@/components/home/demo-phone";
import { Faq } from "@/components/home/faq";
import { Features } from "@/components/home/features";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { PricingTeaser } from "@/components/home/pricing-teaser";
import { Privacy } from "@/components/home/privacy";
import { GenreExplorer } from "@/components/showcase/genre-explorer";
import { PosterRow } from "@/components/showcase/poster-row";
import { Reveal } from "@/components/showcase/reveal";
import { ShowcaseBoundary } from "@/components/showcase/showcase-boundary";
import { SHOWCASE_TEXT } from "@/content/fr/showcase";
import { loadHomeShowcase } from "@/server/catalog/home-showcase";
import { getStaticPageCatalog, isCatalogConfigured } from "@/server/catalog/tmdb/tmdb-catalog";

// Vitrine (U38, AD-46 ; refonte U43, AD-48) : hero avec le lanceur d'identification et le téléphone animé, puis
// « Comment ça marche » qui rejoue une identification au défilement, les rangées d'affiches TMDB, les genres et
// les sections de présentation. Page mise en cache (ISR), régénérée toutes les 6 heures. TMDB non configuré : le
// téléphone joue avec l'image de secours et les rangées disparaissent. TMDB en panne pendant une régénération :
// Next garde la dernière page réussie. Une erreur dans les rangées est contenue par ShowcaseBoundary.
export const revalidate = 21600;

export default async function Home() {
  const showcase = await loadHomeShowcase(getStaticPageCatalog, {
    configured: isCatalogConfigured(),
    // Pendant `next build`, une panne de TMDB ne doit pas bloquer le déploiement.
    building: process.env.NEXT_PHASE === "phase-production-build",
  });
  const { rows } = SHOWCASE_TEXT;

  const demoTitle = demoTitleFrom(showcase?.featured);

  return (
    <>
      <Hero demoTitle={demoTitle} />
      <HowItWorks demoTitle={demoTitle} />
      {showcase ? (
        <ShowcaseBoundary fallback={null}>
          <div className="flex flex-col gap-12 py-12 md:gap-16 md:py-16">
            <PosterRow id="tendances" title={rows.trendingMovies} titles={showcase.trendingMovies} />
            <PosterRow id="series" title={rows.trendingShows} titles={showcase.trendingShows} />
            <Reveal>
              <GenreExplorer genres={showcase.genres} titles={showcase.explore} />
            </Reveal>
            <PosterRow id="mieux-notes" title={rows.topRated} titles={showcase.topRated} />
            <p className="mx-auto w-full max-w-6xl px-4 text-sm text-muted-foreground sm:px-6">{SHOWCASE_TEXT.source}</p>
          </div>
        </ShowcaseBoundary>
      ) : null}
      <Reveal>
        <Features />
      </Reveal>
      <Reveal>
        <Privacy />
      </Reveal>
      <Reveal>
        <PricingTeaser />
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
      <Reveal>
        <FinalCta images={filmStripImages(showcase?.featured)} />
      </Reveal>
    </>
  );
}
