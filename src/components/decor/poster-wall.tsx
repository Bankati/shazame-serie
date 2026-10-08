import { cn } from "@/lib/utils";

// Mosaïque décorative de cadres d'affiches pour le fond du hero (référence : accueil Netflix).
// Pas d'affiches réelles tant que la licence TMDB n'est pas obtenue (Q2) : des cadres teintés suffisent.
const TILE_TONES = [
  "bg-inverse-foreground/15",
  "bg-primary/60",
  "bg-inverse-foreground/10",
  "bg-brand/40",
  "bg-inverse-foreground/20",
  "bg-inverse-foreground/10",
  "bg-primary/40",
  "bg-inverse-foreground/15",
  "bg-brand/25",
] as const;

const ROWS = 4;
const TILES_PER_ROW = 9;

export function PosterWall({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute -inset-x-1/4 -top-1/4 flex -rotate-12 flex-col gap-4">
        {Array.from({ length: ROWS }, (_, row) => (
          <div key={row} className={cn("flex gap-4", row % 2 === 1 && "translate-x-16")}>
            {Array.from({ length: TILES_PER_ROW }, (_, column) => (
              <div
                key={column}
                className={cn(
                  "aspect-[2/3] w-28 shrink-0 rounded-poster border border-inverse-foreground/10 md:w-40",
                  TILE_TONES[(row * 4 + column) % TILE_TONES.length],
                )}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-linear-to-b from-inverse/35 via-inverse/70 to-inverse" />
    </div>
  );
}
