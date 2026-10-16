"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { type ExtractionState, useFrameExtraction } from "@/client/frames/use-frame-extraction";
import { publishQuota } from "@/client/identify/quota";
import { type IdentificationState, useIdentification } from "@/client/identify/use-identification";
import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";

import { ClipDropzone } from "./clip-dropzone";
import { FilmStrip } from "./film-strip";
import { IdentificationResult, IdentificationResultSkeleton } from "./identification-result";

// Carte d'identification de l'accueil : choix du clip, extraction locale (U06), envoi des images (U11)
// et carte de résultat (U12). Le compteur de l'en-tête suit le quota renvoyé par chaque identification.
export function IdentifyPanel() {
  const { state, start, reset } = useFrameExtraction();
  const identification = useIdentification(state.status === "ready" ? state.packageBlobs : null);
  const { dropzone, result } = IDENTIFY_TEXT;
  useEffect(() => {
    if (identification.status === "done") {
      publishQuota(identification.response.quota);
    } else if (identification.status === "failed" && identification.failure.kind === "quota" && identification.failure.quota) {
      publishQuota(identification.failure.quota);
    }
  }, [identification]);

  // Après « Choisir un autre clip », la zone d'envoi remplace la pellicule : le focus doit la suivre.
  const [returningFromResult, setReturningFromResult] = useState(false);

  const showDropzone = state.status === "idle" || state.status === "rejected";
  const finished =
    state.status === "insufficient" || (state.status === "ready" && identification.status !== "sending" && identification.status !== "idle");

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
          <div aria-live="polite" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{statusMessage(state, identification)}</p>
            {identification.status === "sending" ? <IdentificationResultSkeleton /> : null}
            {identification.status === "done" ? <IdentificationResult response={identification.response} /> : null}
            {identification.status === "done" ? (
              <p className="text-sm text-muted-foreground">{result.remaining(identification.response.quota.remaining)}</p>
            ) : null}
          </div>
          {finished ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setReturningFromResult(true);
                reset();
              }}
              className="h-11 w-full text-base sm:w-fit"
            >
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

function statusMessage(state: ExtractionState, identification: IdentificationState): string {
  const { steps, result, failures } = IDENTIFY_TEXT;
  switch (state.status) {
    case "reading":
      return steps.reading;
    case "extracting":
      return steps.extracting(Math.min(state.frames.length + 1, state.total), state.total);
    case "insufficient":
      return result.insufficient;
    case "ready":
      if (identification.status === "failed") {
        return failures[identification.failure.kind];
      }
      return identification.status === "done" ? result.ready(state.packageBlobs.length) : steps.analyzing;
    default:
      return "";
  }
}
