import type { ReactNode } from "react";

import { FilmStripDecor } from "@/components/decor/film-strip-decor";

type ErrorScreenProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions: ReactNode;
};

// Écran commun aux pages 404 et erreur : bande de pellicule, message clair, actions.
export function ErrorScreen({ eyebrow, title, description, actions }: ErrorScreenProps) {
  return (
    <section aria-labelledby="error-title" className="px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-2xl flex-col overflow-hidden rounded-2xl bg-inverse text-inverse-foreground">
        <FilmStripDecor />
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
          {eyebrow ? <p className="text-sm font-semibold text-brand">{eyebrow}</p> : null}
          <h1 id="error-title" className="font-display text-display font-bold md:text-display-lg">
            {title}
          </h1>
          <p className="max-w-prose text-inverse-muted">{description}</p>
          <div className="flex flex-col gap-3 sm:flex-row">{actions}</div>
        </div>
      </div>
    </section>
  );
}
