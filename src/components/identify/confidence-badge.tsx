import { Check, CircleHelp, Info } from "lucide-react";

import { IDENTIFY_TEXT } from "@/content/fr/identify";

// Confiance affichée en pourcentage et en mots, jamais par la seule couleur (ui-context.md, seuils d'affichage).
const SURE_FROM = 80;
const LIKELY_FROM = 50;

export function ConfidenceBadge({ confidence }: { confidence: number }) {
  const { badge } = IDENTIFY_TEXT.card;

  if (confidence >= SURE_FROM) {
    return (
      <span className="inline-flex w-fit items-center gap-1 rounded-sm bg-brand-subtle px-2 py-1 text-sm font-medium text-brand-subtle-foreground">
        <Check className="size-4" aria-hidden="true" />
        {badge.sure(confidence)}
      </span>
    );
  }
  if (confidence >= LIKELY_FROM) {
    return (
      <span className="inline-flex w-fit items-center gap-1 text-sm font-medium text-warning">
        <Info className="size-4" aria-hidden="true" />
        {badge.likely(confidence)}
      </span>
    );
  }
  return (
    <span className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted-foreground">
      <CircleHelp className="size-4" aria-hidden="true" />
      {badge.possible(confidence)}
    </span>
  );
}
