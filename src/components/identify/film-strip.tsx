import { Check, X } from "lucide-react";

import type { CandidateFrame } from "@/client/frames/extract-frames";
import { Perforations } from "@/components/decor/film-strip-decor";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { cn } from "@/lib/utils";
import { CANDIDATE_COUNT } from "@/shared/frames/constants";

const PERFORATIONS = 24;

// Élément signature (ui-context.md) : bande de pellicule où les images extraites apparaissent une à une,
// marquées retenue ou écartée. L'état est annoncé en texte, jamais par la seule couleur.
export function FilmStrip({ frames }: { frames: readonly CandidateFrame[] }) {
  const { strip } = IDENTIFY_TEXT;

  return (
    <figure className="overflow-hidden rounded-lg bg-inverse py-2 text-inverse-foreground">
      <figcaption className="sr-only">{strip.label}</figcaption>
      <Perforations count={PERFORATIONS} className="overflow-hidden" />
      <ol className="my-2 grid grid-cols-5 gap-1.5 px-2">
        {Array.from({ length: CANDIDATE_COUNT }, (_, index) => {
          const frame = frames[index];
          return (
            <li key={index} className="flex min-w-0 flex-col gap-1">
              <div className="aspect-video overflow-hidden rounded-none border border-inverse-foreground/10 bg-inverse-foreground/10">
                {frame ? (
                  // Aperçu local (blob:) : next/image n'apporte rien ici.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frame.previewUrl}
                    alt={strip.frame(index + 1)}
                    className={cn(
                      "size-full object-cover motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300",
                      !frame.verdict.kept && "opacity-40",
                    )}
                  />
                ) : null}
              </div>
              <FrameStatus frame={frame} />
            </li>
          );
        })}
      </ol>
      <Perforations count={PERFORATIONS} className="overflow-hidden" />
    </figure>
  );
}

function FrameStatus({ frame }: { frame: CandidateFrame | undefined }) {
  const { strip } = IDENTIFY_TEXT;

  if (!frame) {
    return <span className="text-xs leading-tight text-inverse-muted">{strip.pending}</span>;
  }
  if (frame.verdict.kept) {
    return (
      <span className="flex items-center gap-0.5 text-xs leading-tight font-medium">
        <Check className="size-3 shrink-0 text-brand" aria-hidden="true" />
        {strip.kept}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs leading-tight text-inverse-muted">
      <X className="size-3 shrink-0" aria-hidden="true" />
      {strip.reasons[frame.verdict.reason]}
    </span>
  );
}
