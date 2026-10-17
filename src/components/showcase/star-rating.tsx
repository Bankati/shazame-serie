import { Star } from "lucide-react";

import { SHOWCASE_TEXT } from "@/content/fr/showcase";
import { cn } from "@/lib/utils";

const STARS = 5;

/** Note TMDB (sur 10) ramenée sur 5 étoiles, avec sa valeur en texte pour les lecteurs d'écran. */
export function StarRating({ voteAverage, className }: { voteAverage: number; className?: string }) {
  const score = Math.max(0, Math.min(STARS, voteAverage / 2));
  const filled = Math.round(score);
  const label = SHOWCASE_TEXT.rating(score.toLocaleString("fr-FR", { maximumFractionDigits: 1 }));
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: STARS }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn("size-3.5", index < filled ? "fill-current text-warning" : "text-muted-foreground")}
        />
      ))}
    </span>
  );
}
