import { Sparkles } from "lucide-react";

import { FilmStripDecor } from "@/components/decor/film-strip-decor";
import { PosterWall } from "@/components/decor/poster-wall";
import { HOME_TEXT } from "@/content/fr/home";

import { ClipDropzonePreview } from "./clip-dropzone-preview";

// Premier écran : salle de projection sombre, l'action d'identification visible tout de suite.
export function Hero() {
  const { hero } = HOME_TEXT;

  return (
    <section id="identifier" aria-labelledby="hero-title" className="relative scroll-mt-16 overflow-hidden bg-inverse text-inverse-foreground">
      <PosterWall />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-10 pb-12 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-20 md:pb-20">
        <div className="flex flex-col gap-5">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-inverse-foreground/20 bg-inverse-foreground/5 px-3 py-1 text-sm font-medium">
            <Sparkles className="size-4 text-brand" aria-hidden="true" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="font-display text-display-lg font-extrabold md:text-display-xl">
            {hero.title}
          </h1>
          <p className="max-w-prose text-base text-inverse-muted md:text-lg">{hero.subtitle}</p>
        </div>
        <ClipDropzonePreview />
      </div>
      <FilmStripDecor className="relative" />
    </section>
  );
}
