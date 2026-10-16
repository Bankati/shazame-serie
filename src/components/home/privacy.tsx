import { ShieldCheck, Timer, UserCheck } from "lucide-react";

import { HOME_TEXT } from "@/content/fr/home";

import { SectionHeading } from "./section-heading";

const POINT_ICONS = [ShieldCheck, Timer, UserCheck] as const;

// Bloc sombre de contraste (référence Bankai) : la promesse de confidentialité (RG7, RG17).
export function Privacy() {
  const { privacy } = HOME_TEXT;

  return (
    <section id="confidentialite" aria-labelledby="privacy-title" className="scroll-mt-16 px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 rounded-2xl bg-inverse p-6 text-inverse-foreground md:p-12">
        <SectionHeading id="privacy-title" eyebrow={privacy.eyebrow} title={privacy.title} align="start" tone="inverse" />
        <ul className="grid gap-8 md:grid-cols-3">
          {privacy.points.map((point, index) => {
            const Icon = POINT_ICONS[index] ?? ShieldCheck;
            return (
              <li key={point.title} className="flex flex-col gap-3 border-t border-inverse-foreground/15 pt-6">
                <Icon className="size-6 text-brand" aria-hidden="true" />
                <h3 className="text-lg font-semibold">{point.title}</h3>
                <p className="text-inverse-muted">{point.description}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
