import { Button } from "@/components/ui/button";
import { FilmStripDecor } from "@/components/decor/film-strip-decor";
import { HOME_TEXT } from "@/content/fr/home";

export function FinalCta() {
  const { finalCta } = HOME_TEXT;

  return (
    <section aria-labelledby="final-cta-title" className="px-4 pb-16 sm:px-6 md:pb-24">
      <div className="mx-auto flex max-w-6xl flex-col overflow-hidden rounded-2xl bg-inverse text-inverse-foreground">
        <FilmStripDecor />
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center md:py-16">
          <h2 id="final-cta-title" className="font-display text-display font-bold md:text-display-lg">
            {finalCta.title}
          </h2>
          <p className="text-inverse-muted md:text-lg">{finalCta.subtitle}</p>
          {/* Vert de marque sur surface sombre, texte foncé : 5,8:1 (ui-context.md). */}
          <Button asChild className="h-11 bg-brand px-6 text-base text-inverse hover:bg-brand/85">
            <a href="#identifier">{finalCta.button}</a>
          </Button>
        </div>
      </div>
    </section>
  );
}
