"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import { type ExtractionState, useFrameExtraction } from "@/client/frames/use-frame-extraction";
import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";

import { ClipDropzone } from "./clip-dropzone";
import { FilmStrip } from "./film-strip";

// Carte d'identification de l'accueil (U06) : choix du clip, extraction locale, pellicule.
// L'envoi au serveur sera branché en U11 ; pour l'instant le parcours s'arrête au paquet prêt.
export function IdentifyPanel() {
  const { state, start, reset } = useFrameExtraction();
  const { dropzone, result } = IDENTIFY_TEXT;
  // Après « Choisir un autre clip », la zone d'envoi remplace la pellicule : le focus doit la suivre.
  const [returningFromResult, setReturningFromResult] = useState(false);

  const showDropzone = state.status === "idle" || state.status === "rejected";
  const finished = state.status === "ready" || state.status === "insufficient";

  return (
    // min-w-0 : élément de grille du hero, il ne doit pas s'élargir pour contenir la pellicule.
    <div className="min-w-0 rounded-xl bg-card p-4 text-card-foreground shadow-lg md:p-6">
      {showDropzone ? (
        <ClipDropzone
          onFile={start}
          problem={state.status === "rejected" ? state.problem : undefined}
          focusOnMount={returningFromResult}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FilmStrip frames={"frames" in state ? state.frames : []} />
          <p aria-live="polite" className="text-sm font-medium text-foreground">
            {statusMessage(state)}
          </p>
          {finished ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReturningFromResult(true);
                reset();
              }}
              className="h-11 w-full text-base sm:w-fit">
              {result.another}
            </Button>
          ) : null}
        </div>
      )}
      <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        {dropzone.privacy}
      </p>
    </div>
  );
}

function statusMessage(state: ExtractionState): string {
  const { steps, result } = IDENTIFY_TEXT;
  switch (state.status) {
    case "reading":
      return steps.reading;
    case "extracting":
      return steps.extracting(Math.min(state.frames.length + 1, state.total), state.total);
    case "ready":
      return `${result.ready(state.packageBlobs.length)} ${result.comingSoon}`;
    case "insufficient":
      return result.insufficient;
    default:
      return "";
  }
}
