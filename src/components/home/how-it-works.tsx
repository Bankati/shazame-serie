import { Clapperboard, Film, ScanSearch } from "lucide-react";

import { HOME_TEXT } from "@/content/fr/home";

import { SectionHeading } from "./section-heading";

const STEP_ICONS = [Film, ScanSearch, Clapperboard] as const;

export function HowItWorks() {
  const { howItWorks } = HOME_TEXT;

  return (
    <section id="comment-ca-marche" aria-labelledby="how-title" className="scroll-mt-16 px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <SectionHeading id="how-title" eyebrow={howItWorks.eyebrow} title={howItWorks.title} subtitle={howItWorks.subtitle} />
        <ol className="grid gap-4 md:grid-cols-3">
          {howItWorks.steps.map((step, index) => {
            const Icon = STEP_ICONS[index] ?? Film;
            return (
              <li key={step.title} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6">
                <div className="flex items-center justify-between">
                  <span className="font-display text-display-lg font-extrabold text-primary" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex size-11 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-foreground" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
