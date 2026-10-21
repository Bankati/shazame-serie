import { Button } from "@/components/ui/button";
import { FilmStripDecor } from "@/components/decor/film-strip-decor";
import { TwoTone } from "@/components/layout/two-tone";
import { HOME_TEXT } from "@/content/fr/home";

export function FinalCta() {
  const { finalCta } = HOME_TEXT;

  return (
    <section aria-labelledby="final-cta-title" className="px-4 pb-16 sm:px-6 md:pb-24">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-2xl bg-inverse text-inverse-foreground">
        <FilmStripDecor />
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center md:py-16">
          <h2 id="final-cta-title" className="font-display text-display font-bold md:text-display-lg">
            <TwoTone text={finalCta.title} highlight={finalCta.highlight} tone="inverse" />
          </h2>
          <p className="text-inverse-muted md:text-lg">{finalCta.subtitle}</p>
          {/* Bouton d'accent unique (AD-45) : vert, texte foncé 7,9:1. */}
          <Button asChild className="h-11 px-6 text-base hover:bg-primary-hover">
            <a href="#identifier">{finalCta.button}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
