import { Film } from "lucide-react";
import Image from "next/image";

import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { cn } from "@/lib/utils";
import { type PosterSize, posterUrl } from "@/lib/tmdb-image";

type TitlePosterProps = {
  title: string;
  year: number | null;
  posterPath: string | null;
  size: PosterSize;
  /** Largeur affichée en pixels (la hauteur suit le ratio 2:3). */
  width: number;
  className?: string;
};

// Affiche TMDB au ratio 2:3, `rounded-poster` (ui-context.md). Servie sans l'optimiseur Vercel :
// TMDB fournit déjà la taille demandée (next.config.ts, library-docs.md).
export function TitlePoster({ title, year, posterPath, size, width, className }: TitlePosterProps) {
  const { card } = IDENTIFY_TEXT;
  const src = posterUrl(posterPath, size);
  const height = Math.round((width * 3) / 2);

  if (!src) {
    return (
      <div
        role="img"
        aria-label={card.noPoster}
        style={{ width, height }}
        className={cn("flex shrink-0 items-center justify-center rounded-poster bg-muted", className)}
      >
        <Film className="size-6 text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={card.poster(title, year)}
      width={width}
      height={height}
      unoptimized
      className={cn("shrink-0 rounded-poster bg-muted object-cover", className)}
    />
  );
}
