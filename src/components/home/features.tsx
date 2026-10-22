import { Bookmark, Check, CircleCheck, Film, Sparkles } from "lucide-react";

import { TwoTone } from "@/components/layout/two-tone";
import { HOME_TEXT } from "@/content/fr/home";
import { cn } from "@/lib/utils";

import { MockWindow } from "./mock-window";
import { SectionHeading } from "./section-heading";

// Fonctionnalités (U39) : trois sections alternées, chacune illustrée par une maquette de nos vrais écrans
// (résultat, analyse, où regarder), comme le site de référence. Exemples d'affichage, aucun chiffre inventé.
export function Features() {
  const { features } = HOME_TEXT;
  const mocks = [<ResultMock key="result" />, <AnalysisMock key="analysis" />, <WatchMock key="watch" />];

  return (
    <section id="fonctionnalites" aria-labelledby="features-title" className="scroll-mt-16 bg-card px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 md:gap-24">
        <SectionHeading id="features-title" eyebrow={features.eyebrow} title={features.title} highlight={features.highlight} subtitle={features.subtitle} />
        {features.showcase.map((item, index) => (
          <div key={item.title} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
            <div className={cn("flex flex-col gap-3", index % 2 === 1 && "md:order-2")}>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-strong">{item.eyebrow}</p>
              <h3 className="font-display text-display font-bold">
                <TwoTone text={item.title} highlight={item.highlight} />
              </h3>
              <p className="text-base text-muted-foreground md:text-lg">{item.description}</p>
            </div>
            <div className={cn(index % 2 === 1 && "md:order-1")}>{mocks[index]}</div>
          </div>
        ))}
        <p className="text-center text-sm text-muted-foreground">{features.mock.note}</p>
      </div>
    </section>
  );
}

function ResultMock() {
  const { mock } = HOME_TEXT.features;
  return (
    <MockWindow title={mock.window}>
      <div className="flex gap-4">
        <div className="flex aspect-[2/3] w-24 shrink-0 items-center justify-center rounded-poster bg-muted">
          <Film className="size-6 text-muted-foreground" />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <p className="truncate font-display text-xl font-bold">{mock.exampleTitle}</p>
          <p className="text-sm text-muted-foreground">{mock.exampleMeta}</p>
          <span className="inline-flex w-fit items-center gap-1 rounded-sm bg-brand-subtle px-2 py-1 text-sm font-medium text-brand-subtle-foreground">
            <Check className="size-4" />
            {mock.confidence}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {mock.exampleGenres.map((genre) => (
              <span key={genre} className="rounded-sm border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {genre}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">{mock.sheet}</span>
        <span className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium">
          <Bookmark className="size-4" />
          {mock.watchlist}
        </span>
      </div>
    </MockWindow>
  );
}

function AnalysisMock() {
  const { mock } = HOME_TEXT.features;
  return (
    <MockWindow title={mock.analysisWindow}>
      <ol className="flex flex-col gap-3">
        {mock.steps.map((step, index) => {
          const last = index === mock.steps.length - 1;
          return (
            <li key={step.title} className={cn("flex items-center gap-3 rounded-lg border p-3", last ? "border-brand-strong/40 bg-brand-subtle" : "border-border")}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                {last ? <CircleCheck className="size-4 text-brand-strong" /> : index + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-semibold">{step.title}</span>
                <span className="truncate text-xs text-muted-foreground">{step.detail}</span>
              </span>
              {index === 1 ? <Sparkles className="ml-auto size-4 shrink-0 text-brand-strong" /> : null}
            </li>
          );
        })}
      </ol>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-4/5 rounded-full bg-primary" />
      </div>
    </MockWindow>
  );
}

function WatchMock() {
  const { mock } = HOME_TEXT.features;
  return (
    <MockWindow title={mock.watchWindow}>
      <ul className="flex flex-col gap-3">
        {mock.services.map((service) => (
          <li key={service.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted font-display text-lg font-bold">
              {service.name.charAt(0)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">{service.name}</span>
              <span className="text-xs text-muted-foreground">{service.kind}</span>
            </span>
            <span
              className={cn(
                "rounded-sm px-2 py-1 text-xs font-medium",
                service.status === "Disponible" ? "bg-brand-subtle text-brand-subtle-foreground" : "bg-muted text-warning",
              )}
            >
              {service.status}
            </span>
          </li>
        ))}
      </ul>
    </MockWindow>
  );
}
