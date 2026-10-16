import { Check, Film, Info, ListPlus, MonitorPlay } from "lucide-react";

import { HOME_TEXT } from "@/content/fr/home";
import { cn } from "@/lib/utils";

import { SectionHeading } from "./section-heading";

const DECOR_POSTERS = ["bg-primary/50", "bg-brand/40", "bg-inverse-foreground/15"] as const;

// Grille asymétrique (bento, référence Flowblox) : une carte sombre mise en avant, trois cartes claires.
export function Features() {
  const { features } = HOME_TEXT;

  return (
    <section id="fonctionnalites" aria-labelledby="features-title" className="scroll-mt-16 bg-card px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <SectionHeading id="features-title" eyebrow={features.eyebrow} title={features.title} subtitle={features.subtitle} />
        <ul className="grid gap-4 md:grid-cols-3">
          <li className="relative flex min-h-72 flex-col justify-end gap-3 overflow-hidden rounded-xl bg-inverse p-6 text-inverse-foreground md:col-span-2 md:p-8">
            <div aria-hidden="true" className="absolute top-6 right-6 flex gap-3">
              {DECOR_POSTERS.map((tone, index) => (
                <div
                  key={tone}
                  className={cn(
                    "aspect-[2/3] w-16 rounded-poster border border-inverse-foreground/10 md:w-24",
                    tone,
                    index === 1 && "translate-y-4",
                  )}
                />
              ))}
            </div>
            <Film className="size-6 text-brand" aria-hidden="true" />
            <h3 className="font-display text-display font-bold">{features.sheet.title}</h3>
            <p className="max-w-md text-inverse-muted">{features.sheet.description}</p>
          </li>
          <li className="flex flex-col gap-3 rounded-xl bg-brand-subtle p-6 text-brand-subtle-foreground md:p-8">
            <MonitorPlay className="size-6" aria-hidden="true" />
            <h3 className="text-xl font-semibold">{features.watch.title}</h3>
            <p>{features.watch.description}</p>
          </li>
          <li className="flex flex-col gap-3 rounded-xl border border-border bg-background p-6 md:p-8">
            <Info className="size-6 text-primary" aria-hidden="true" />
            <h3 className="text-xl font-semibold">{features.confidence.title}</h3>
            <p className="text-muted-foreground">{features.confidence.description}</p>
            <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-sm bg-brand-subtle px-2.5 py-1 text-sm font-medium text-brand-subtle-foreground">
              <Check className="size-4" aria-hidden="true" />
              {features.confidence.sample}
            </span>
          </li>
          <li className="flex flex-col gap-6 rounded-xl border border-border bg-background p-6 md:col-span-2 md:flex-row md:items-center md:p-8">
            <div className="flex flex-1 flex-col gap-3">
              <ListPlus className="size-6 text-primary" aria-hidden="true" />
              <h3 className="text-xl font-semibold">{features.watchlist.title}</h3>
              <p className="text-muted-foreground">{features.watchlist.description}</p>
            </div>
            <div aria-hidden="true" className="flex flex-1 flex-col gap-3">
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center gap-3 rounded-lg bg-card p-3">
                  <div className="aspect-[2/3] w-8 rounded-poster bg-muted" />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="h-2.5 w-2/3 rounded-full bg-muted" />
                    <div className="h-2 w-1/3 rounded-full bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
