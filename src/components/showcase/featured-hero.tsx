"use client";

import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PAUSE_ATTRIBUTE } from "@/components/decor/curved-film-band";
import { Button } from "@/components/ui/button";
import { HOME_TEXT } from "@/content/fr/home";
import { SHOWCASE_TEXT } from "@/content/fr/showcase";
import { cn } from "@/lib/utils";
import { titlePath } from "@/lib/title-url";
import type { ShowcaseTitle } from "@/server/catalog/catalog-provider";

import { TwoTone } from "@/components/layout/two-tone";

import { RowButton } from "./poster-row";
import { StarRating } from "./star-rating";

const BACKDROP_BASE = "https://image.tmdb.org/t/p/w1280";
const AUTOPLAY_DELAY_MS = 7_000;

const STAGGER = { hidden: {}, visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }, exit: {} } as const;
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
} as const;

// Vedette de l'accueil (refonte sombre, maquette du fondateur) : grandes images des titres en tendance en
// fondu enchaîné, zoom lent, textes qui apparaissent en cascade. La zone d'envoi du clip reste au premier
// plan (ui-context.md : l'action est visible sans défiler) : à droite sur ordinateur, en tête sur mobile.
// Défilement automatique coupé si l'utilisateur réduit les animations, s'il le met en pause, ou pendant
// l'analyse d'un clip (attribut posé par IdentifyPanel).
export function FeaturedHero({ titles, children }: { titles: readonly ShowcaseTitle[]; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  const autoplay = useMemo(() => Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnInteraction: false, stopOnMouseEnter: true }), []);
  const plugins = useMemo(() => (reduceMotion ? [Fade()] : [Fade(), autoplay]), [reduceMotion, autoplay]);
  const [viewportRef, api] = useEmblaCarousel({ loop: true, duration: 30 }, plugins);
  const [index, setIndex] = useState(0);
  // Images montées au fur et à mesure : seule la première est chargée d'emblée (4G).
  const [loaded, setLoaded] = useState(1);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const { featured } = SHOWCASE_TEXT;
  const { hero } = HOME_TEXT;

  const onSelect = useCallback(() => {
    if (!api) return;
    const selected = api.selectedScrollSnap();
    setIndex(selected);
    setLoaded((count) => Math.max(count, Math.min(titles.length, selected + 2)));
  }, [api, titles.length]);

  useEffect(() => {
    if (!api) return;
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSelect]);

  // Pause automatique pendant l'analyse d'un clip : l'extraction des images garde le processeur.
  useEffect(() => {
    const section = sectionRef.current;
    // Le greffon de lecture automatique n'existe qu'une fois Embla initialisé (api disponible).
    if (!section || !api || reduceMotion) return;
    // On n'agit que quand l'état change : rappeler play() à chaque mutation relancerait le défilement
    // pendant un survol (stopOnMouseEnter) et décalerait la minuterie.
    let stopped: boolean | null = null;
    const sync = () => {
      const shouldStop = paused || section.querySelector(`[${PAUSE_ATTRIBUTE}]`) !== null;
      if (shouldStop === stopped) return;
      stopped = shouldStop;
      if (shouldStop) autoplay.stop();
      else autoplay.play();
    };
    const observer = new MutationObserver(sync);
    // L'attribut apparaît ou disparaît sur le panneau d'identification : seuls les attributs sont observés.
    observer.observe(section, { subtree: true, attributes: true, attributeFilter: [PAUSE_ATTRIBUTE] });
    sync();
    return () => observer.disconnect();
  }, [api, autoplay, paused, reduceMotion]);

  const current = titles[index] ?? titles[0];
  if (!current) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      id="identifier"
      aria-labelledby="hero-title"
      className="relative scroll-mt-16 overflow-hidden bg-inverse text-inverse-foreground"
    >
      {/* Images de fond (décoratives) en fondu enchaîné. */}
      <div ref={viewportRef} aria-hidden="true" className="absolute inset-0 overflow-hidden">
        <div className="flex h-full">
          {titles.map((title, slide) => (
            <div key={`${title.mediaType}-${title.tmdbId}`} className="relative h-full min-w-0 flex-[0_0_100%]">
              {slide < loaded && title.backdropPath ? (
                <Image
                  src={`${BACKDROP_BASE}${title.backdropPath}`}
                  alt=""
                  fill
                  priority={slide === 0}
                  sizes="100vw"
                  unoptimized
                  className={cn("object-cover object-top", slide === index && "animate-ken-burns")}
                />
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-background via-inverse/70 to-inverse/30" />
      <div aria-hidden="true" className="absolute inset-0 hidden bg-linear-to-r from-inverse via-inverse/60 to-transparent md:block" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-8 pb-12 sm:px-6 md:min-h-[38rem] md:grid-cols-2 md:gap-12 md:pt-16 md:pb-20">
        {/* Titre en vedette : sous la zone d'envoi sur mobile, à gauche sur ordinateur. */}
        <div className="order-2 flex min-w-0 flex-col gap-5 md:order-1" role="region" aria-roledescription="carrousel" aria-label={featured.region}>
          <AnimatePresence mode="wait" initial={false}>
            <m.div key={`${current.mediaType}-${current.tmdbId}`} className="flex flex-col gap-4" variants={STAGGER} initial="hidden" animate="visible" exit="exit">
              <m.p variants={ITEM} className="flex items-center gap-3 text-sm font-semibold tracking-wide text-inverse-muted uppercase">
                <span>{featured.eyebrow}</span>
                <span className="rounded-sm border border-inverse-foreground/30 px-2 py-0.5 text-sm normal-case">{featured.kind[current.mediaType]}</span>
              </m.p>
              <m.h2 variants={ITEM} className="font-display text-display-lg font-extrabold md:text-display-xl">
                {current.title}
              </m.h2>
              <m.p variants={ITEM} className="flex items-center gap-3 text-sm text-inverse-muted">
                <StarRating voteAverage={current.voteAverage} />
                {current.year ? <span>{current.year}</span> : null}
              </m.p>
              <m.p variants={ITEM} className="line-clamp-3 max-w-prose text-base text-inverse-muted md:text-lg">
                {current.overview}
              </m.p>
              <m.div variants={ITEM}>
                <Button asChild className="h-11 px-5 text-base hover:bg-primary-hover">
                  <Link href={titlePath(current.mediaType, current.tmdbId, current.title)}>{featured.viewTitle}</Link>
                </Button>
              </m.div>
            </m.div>
          </AnimatePresence>

          {/* Passe à la ligne sur petit écran : 8 cibles de 44 px ne tiennent pas sur 380 px. */}
          <div className="flex flex-wrap items-center gap-3">
            <RowButton label={featured.previous} onClick={() => api?.scrollPrev()}>
              <ChevronLeft className="size-5" aria-hidden="true" />
            </RowButton>
            <RowButton label={featured.next} onClick={() => api?.scrollNext()}>
              <ChevronRight className="size-5" aria-hidden="true" />
            </RowButton>
            {reduceMotion ? null : (
              <RowButton label={paused ? featured.play : featured.pause} onClick={() => setPaused((value) => !value)}>
                {paused ? <Play className="size-5" aria-hidden="true" /> : <Pause className="size-5" aria-hidden="true" />}
              </RowButton>
            )}
            <ol className="flex items-center">
              {titles.map((title, dot) => (
                <li key={`${title.mediaType}-${title.tmdbId}`}>
                  <button
                    type="button"
                    aria-label={featured.goTo(dot + 1, titles.length, title.title)}
                    aria-current={dot === index ? "true" : undefined}
                    onClick={() => api?.scrollTo(dot)}
                    className="group flex size-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <m.span
                      aria-hidden="true"
                      className={cn("block h-1.5 rounded-full", dot === index ? "bg-inverse-foreground" : "bg-inverse-foreground/40 group-hover:bg-inverse-foreground/70")}
                      animate={{ width: dot === index ? 28 : 8 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Action principale : identifier un clip. */}
        <div className="order-1 flex min-w-0 flex-col gap-4 md:order-2">
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">{hero.eyebrow}</p>
            <h1 id="hero-title" className="font-display text-display font-extrabold md:text-display-lg">
              <TwoTone text={hero.title} highlight={hero.highlight} />
            </h1>
          </m.div>
          <m.div initial={{ opacity: 0, y: 32, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7, delay: 0.15 }}>
            {children}
          </m.div>
        </div>
      </div>
    </section>
  );
}
