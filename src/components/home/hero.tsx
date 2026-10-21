import { Sparkles } from "lucide-react";

import { CurvedFilmBand } from "@/components/decor/curved-film-band";
import { FilmStripDecor } from "@/components/decor/film-strip-decor";
import { IdentifyPanel } from "@/components/identify/identify-panel";
import { TwoTone } from "@/components/layout/two-tone";
import { HOME_TEXT } from "@/content/fr/home";

// Photos d'ambiance Unsplash (licence Unsplash), hébergées par le site : aucune affiche de film réelle
// tant que la licence TMDB n'est pas obtenue (Q2). Identifiants Unsplash dans context/ui-registry.md.
const BAND_IMAGES = [
  "/hero/projecteur.webp",
  "/hero/fauteuils-rouges.webp",
  "/hero/clap-tournage.webp",
  "/hero/salle-sombre.webp",
  "/hero/bobines-projecteur.webp",
  "/hero/pop-corn.webp",
  "/hero/spectateurs.webp",
  "/hero/bobines-pellicule.webp",
  "/hero/rangees-fauteuils.webp",
  "/hero/ecran-blanc.webp",
] as const;

// Premier écran : salle de projection sombre, l'action d'identification visible tout de suite.
// En fond, le bandeau d'images courbé, assombri pour que le texte reste lisible (contraste AA).
export function Hero() {
  const { hero } = HOME_TEXT;

  return (
    <section id="identifier" aria-labelledby="hero-title" className="relative scroll-mt-16 overflow-hidden bg-inverse text-inverse-foreground">
      <CurvedFilmBand images={BAND_IMAGES} axis={46} tileHeight={28} className="absolute inset-0" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-linear-to-b from-inverse/50 via-inverse/70 to-inverse" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-12 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-20 md:pb-20">
        <div className="flex flex-col gap-5">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-inverse-foreground/20 bg-inverse-foreground/5 px-3 py-1 text-sm font-medium">
            <Sparkles className="size-4 text-brand" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="font-display text-display-lg font-extrabold md:text-display-xl">
            <TwoTone text={hero.title} highlight={hero.highlight} tone="inverse" />
          </h1>
          <p className="max-w-prose text-base text-inverse-muted md:text-lg">{hero.subtitle}</p>
        </div>
        <IdentifyPanel />
      </div>
      <FilmStripDecor className="relative" />
    </section>
  );
}
