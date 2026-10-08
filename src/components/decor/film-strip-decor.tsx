import { cn } from "@/lib/utils";

// Bande de pellicule décorative : annonce l'élément signature (FilmStrip, U06) sans logique.
const PERFORATIONS = 80;
const FRAMES = 14;

export function FilmStripDecor({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2 overflow-hidden bg-inverse py-2", className)}>
      <Perforations />
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
      <Perforations />
    </div>
  );
}

function Perforations() {
  return (
    <div className="flex gap-3 px-2">
      {Array.from({ length: PERFORATIONS }, (_, index) => (
        <span key={index} className="size-3 shrink-0 rounded-sm bg-inverse-foreground/25" />
      ))}
    </div>
  );
}
