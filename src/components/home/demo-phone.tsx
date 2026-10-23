import { Bookmark, CircleCheck, Clapperboard, Lock, Play, ScanSearch } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { APP_TEXT } from "@/content/fr/app";
import { HOME_TEXT } from "@/content/fr/home";
import { backdropUrl, posterUrl } from "@/lib/tmdb-image";
import { cn } from "@/lib/utils";
import type { ShowcaseTitle } from "@/server/catalog/catalog-provider";

/** Titre joué par la démonstration : une affiche en tendance (TMDB) ou l'image de secours du site. */
export type DemoTitle = { title: string; year: number | null; posterSrc: string };

/** Image de secours (Unsplash, hébergée par le site) quand TMDB n'est pas disponible. */
export const DEMO_FALLBACK: DemoTitle = {
  title: HOME_TEXT.demo.fallbackTitle,
  year: null,
  posterSrc: "/hero/salle-sombre.webp",
};

/** Premier titre en tendance qui a une affiche, sinon l'image de secours. */
export function demoTitleFrom(titles: readonly ShowcaseTitle[] | undefined): DemoTitle {
  for (const title of titles ?? []) {
    const posterSrc = posterUrl(title.posterPath, "w342");
    if (posterSrc) return { title: title.title, year: title.year, posterSrc };
  }
  return DEMO_FALLBACK;
}

/** Images de fond (16:9) des titres en tendance pour la pellicule de la dernière section, 10 au plus. */
export function filmStripImages(titles: readonly ShowcaseTitle[] | undefined): string[] {
  return (titles ?? []).flatMap((title) => backdropUrl(title.backdropPath, "w300") ?? []).slice(0, 10);
}

// Cadrages d'une même affiche : les « images extraites » de la démonstration.
const THUMB_POSITIONS = ["object-top", "object-center", "object-bottom"] as const;

// Téléphone de démonstration (U43, AD-48) : quatre écrans superposés (extrait, images extraites, analyse,
// résultat), animés par GSAP depuis le composant parent (demo-timeline.ts). Sans JavaScript ou avec
// « moins d'animations », seul l'écran du résultat est visible. Décoratif : un libellé résume la scène.
// Thème sombre (AD-49) : coque gris foncé, sinon elle prendrait la couleur du texte (blanc).
export function DemoPhone({ title, className }: { title: DemoTitle; className?: string }) {
  const { demo } = HOME_TEXT;

  return (
    <div role="img" aria-label={demo.label} className={cn("demo-phone relative aspect-[9/19] w-64 md:w-72", className)}>
      {/* Boutons latéraux de la coque */}
      <span aria-hidden="true" className="absolute top-24 -left-1 h-8 w-1 rounded-l-sm bg-foreground dark:bg-secondary" />
      <span aria-hidden="true" className="absolute top-36 -left-1 h-12 w-1 rounded-l-sm bg-foreground dark:bg-secondary" />
      <span aria-hidden="true" className="absolute top-32 -right-1 h-16 w-1 rounded-r-sm bg-foreground dark:bg-secondary" />
      <div
        aria-hidden="true"
        className="relative h-full rounded-phone bg-foreground p-2 shadow-2xl ring-1 ring-foreground/20 dark:bg-secondary dark:ring-border"
      >
        <div className="relative h-full overflow-hidden rounded-phone-screen bg-background text-foreground">
          <span className="absolute top-2 left-1/2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground dark:bg-background" />
          <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 px-5 pt-10">
            <span className="flex size-6 items-center justify-center rounded-sm bg-brand text-primary-foreground">
              <Clapperboard className="size-4" />
            </span>
            <span className="font-display text-sm font-bold">{APP_TEXT.name}</span>
          </div>

          {/* 1. L'extrait */}
          <Screen step={0} hidden>
            <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-inverse">
              <Image src={title.posterSrc} alt="" fill sizes="256px" unoptimized className="object-cover" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-inverse/70 text-inverse-foreground">
                  <Play className="size-6" />
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-inverse/70 px-3 py-2 text-xs text-inverse-foreground">
                <span className="flex justify-between">
                  <span>{demo.clip.source}</span>
                  <span>{demo.clip.duration}</span>
                </span>
                <span className="h-1 overflow-hidden rounded-full bg-inverse-foreground/30">
                  <span className="demo-progress block h-full w-full origin-left rounded-full bg-brand-light" />
                </span>
              </span>
            </div>
            <span className="demo-cta flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              <ScanSearch className="size-4" />
              {demo.clip.action}
            </span>
          </Screen>

          {/* 2. Images extraites dans le navigateur */}
          <Screen step={1} hidden>
            <p className="text-sm font-semibold">{demo.extract.title}</p>
            <Thumbs posterSrc={title.posterSrc} />
            <p className="flex items-start gap-2 rounded-md bg-brand-subtle p-2 text-xs font-medium text-brand-subtle-foreground">
              <Lock className="mt-0.5 size-3 shrink-0" />
              {demo.extract.note}
            </p>
            <Checklist />
          </Screen>

          {/* 3. Analyse */}
          <Screen step={2} hidden>
            <div className="relative">
              <Thumbs posterSrc={title.posterSrc} />
              <span className="demo-scan absolute inset-y-0 left-0 w-1 rounded-full bg-brand-light shadow-lg" />
            </div>
            <div className="flex items-center gap-3">
              <svg viewBox="0 0 36 36" className="size-10 shrink-0 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" strokeWidth="4" className="stroke-muted" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray="100"
                  strokeDashoffset="100"
                  className="demo-ring stroke-primary"
                />
              </svg>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{demo.analyse.title}</span>
                <span className="text-xs text-muted-foreground">{demo.analyse.note}</span>
              </span>
            </div>
            <Checklist />
          </Screen>

          {/* 4. Résultat : visible par défaut (sans JavaScript, « moins d'animations ») */}
          <Screen step={3}>
            <p className="demo-result-item text-xs font-semibold tracking-widest text-brand-strong uppercase">
              {demo.result.eyebrow}
            </p>
            <div className="demo-result-item flex gap-3">
              <span className="relative aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-poster bg-muted">
                <Image src={title.posterSrc} alt="" fill sizes="80px" unoptimized className="object-cover" />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="font-display text-lg leading-tight font-bold">{title.title}</span>
                {title.year ? <span className="text-xs text-muted-foreground">{title.year}</span> : null}
                <span className="demo-confidence mt-1 w-fit rounded-sm bg-brand-subtle px-2 py-1 text-xs font-semibold text-brand-subtle-foreground">
                  {demo.result.confidence}
                </span>
              </span>
            </div>
            <div className="demo-result-item flex flex-col gap-2">
              <span className="text-xs font-semibold">{demo.result.watchTitle}</span>
              <span className="flex flex-wrap gap-1">
                {demo.result.offers.map((offer) => (
                  <span key={offer} className="rounded-sm border border-border bg-card px-2 py-1 text-xs">
                    {offer}
                  </span>
                ))}
              </span>
            </div>
            <p className="demo-result-item text-xs text-muted-foreground">{demo.overview}</p>
            <span className="demo-result-item flex h-10 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
              {demo.open}
            </span>
            <span className="demo-result-item flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-medium">
              <Bookmark className="size-4" />
              {demo.result.add}
            </span>
          </Screen>
        </div>
      </div>
    </div>
  );
}

function Screen({ step, hidden = false, children }: { step: number; hidden?: boolean; children: ReactNode }) {
  return (
    <div
      data-demo-step={step}
      className={cn("demo-screen absolute inset-x-0 top-20 flex flex-col gap-3 px-4", hidden && "invisible opacity-0")}
    >
      {children}
    </div>
  );
}

function Thumbs({ posterSrc }: { posterSrc: string }) {
  return (
    <span className="grid grid-cols-3 gap-2">
      {THUMB_POSITIONS.map((position) => (
        <span key={position} className="demo-thumb relative aspect-[3/4] overflow-hidden rounded-sm bg-muted">
          <Image src={posterSrc} alt="" fill sizes="80px" unoptimized className={cn("object-cover", position)} />
        </span>
      ))}
    </span>
  );
}

function Checklist() {
  return (
    <ul className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      {HOME_TEXT.demo.checklist.map((item) => (
        <li key={item} className="demo-check flex items-center gap-2 text-xs">
          <CircleCheck className="size-4 shrink-0 text-success" />
          {item}
        </li>
      ))}
    </ul>
  );
}
