import Image from "next/image";

import { cn } from "@/lib/utils";

// Bande de pellicule décorative ; ses perforations sont reprises par l'élément signature FilmStrip (U06).
// Avec `images` (U43) : les cases montrent ces images et la bande défile en continu (liste doublée pour boucler).
const PERFORATIONS = 80;
const FRAMES = 14;

export function FilmStripDecor({ images, className }: { images?: readonly string[]; className?: string }) {
  const frames = images && images.length > 0 ? [...images, ...images] : null;

  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2 overflow-hidden bg-inverse py-2", className)}>
      <Perforations count={PERFORATIONS} />
      {frames ? (
        <div className="flex w-max animate-film-scroll gap-2 px-2">
          {frames.map((src, index) => (
            <div key={`${src}-${index}`} className="relative aspect-video w-32 shrink-0 overflow-hidden border border-inverse-foreground/10 md:w-40">
              <Image src={src} alt="" fill sizes="160px" unoptimized className="object-cover" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 px-2">
          {Array.from({ length: FRAMES }, (_, index) => (
            <div
              key={index}
              className={cn(
                "aspect-video w-32 shrink-0 rounded-none border border-inverse-foreground/10 md:w-40",
                index % 3 === 1 ? "bg-brand/30" : "bg-inverse-foreground/10",
              )}
            />
          ))}
        </div>
      )}
      <Perforations count={PERFORATIONS} />
    </div>
  );
}

/** Rangée de perforations de pellicule (décorative, aria-hidden par le parent). */
export function Perforations({ count, className }: { count: number; className?: string }) {
  return (
    <div className={cn("flex gap-3 px-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="size-3 shrink-0 rounded-sm bg-inverse-foreground/25" />
      ))}
    </div>
  );
}
