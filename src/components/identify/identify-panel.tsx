"use client";

import { Lock } from "lucide-react";
import { useEffect, useState } from "react";

import { type ExtractionState, useFrameExtraction } from "@/client/frames/use-frame-extraction";
import { publishQuota } from "@/client/identify/quota";
import { type IdentificationState, useIdentification } from "@/client/identify/use-identification";
import { PAUSE_ATTRIBUTE } from "@/components/decor/curved-film-band";
import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import type { IdentifyResponse } from "@/schemas/identify";

import { ClipDropzone } from "./clip-dropzone";
import { ExcerptPicker } from "./excerpt-picker";
import { FilmStrip } from "./film-strip";
import { IdentificationResultSkeleton } from "./identification-result";
import { ResultDialog } from "./result-dialog";

// Carte d'identification de l'accueil : choix du clip, extraction locale (U06), envoi des images (U11)
// et résultat dans une fenêtre (U12, fenêtre demandée le 16 octobre 2026). Le compteur de l'en-tête suit le
// quota renvoyé par chaque identification.
export function IdentifyPanel() {
  const { state, start, choose, reset } = useFrameExtraction();
  const identification = useIdentification(
    state.status === "ready" ? state.packageBlobs : null,
    state.status === "ready" ? state.mode : "clip",
  );
  const { dropzone, result, dialog, steps } = IDENTIFY_TEXT;
  useEffect(() => {
    if (identification.status === "done") {
      publishQuota(identification.response.quota);
    } else if (identification.status === "failed" && identification.failure.kind === "quota" && identification.failure.quota) {
      publishQuota(identification.failure.quota);
    }
  }, [identification]);

  // Après « Choisir un autre clip », la zone d'envoi remplace la pellicule : le focus doit la suivre.
  const [returningFromResult, setReturningFromResult] = useState(false);
  // La fenêtre s'ouvre d'elle-même à chaque nouveau résultat ; fermée, elle se rouvre par « Voir le résultat ».
  const [closedResponse, setClosedResponse] = useState<IdentifyResponse | null>(null);
  const response = identification.status === "done" ? identification.response : null;

  const chooseAnother = () => {
    setReturningFromResult(true);
    setClosedResponse(response);
    reset();
  };

  const showDropzone = state.status === "idle" || state.status === "rejected";
  // Lecture longue possible (lecteur de secours de 32 Mo en 4G, grosse vidéo) : on peut toujours renoncer.
  const reading = state.status === "reading" || state.status === "preparing" || state.status === "extracting";
  const finished =
    state.status === "insufficient" || (state.status === "ready" && identification.status !== "sending" && identification.status !== "idle");

  return (
    // min-w-0 : élément de grille du hero, il ne doit pas s'élargir pour contenir la pellicule.
    <div
      className="min-w-0 rounded-xl bg-card p-4 text-card-foreground shadow-lg md:p-6"
      // Bandeau du hero en pause pendant l'analyse : l'extraction des images garde tout le processeur.
      {...(showDropzone ? {} : { [PAUSE_ATTRIBUTE]: "" })}
    >
      {showDropzone ? (
        <ClipDropzone
          onFiles={(files) => void start(files)}
          problem={state.status === "rejected" ? state.problem : undefined}
          focusOnMount={returningFromResult}
        />
      ) : state.status === "choosing" ? (
        <ExcerptPicker
          // Nouvelle vidéo : curseur remis au milieu.
          key={state.previewUrl ?? state.durationS}
          durationS={state.durationS}
          initialStartS={state.startS}
          previewUrl={state.previewUrl}
          onAnalyze={(startS) => void choose(startS)}
          onCancel={chooseAnother}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <FilmStrip frames={"frames" in state ? state.frames : []} />
          <div aria-live="polite" className="flex flex-col gap-2">
            <p className="text-sm font-medium text-foreground">{statusMessage(state, identification)}</p>
            {identification.status === "sending" ? <IdentificationResultSkeleton /> : null}
            {response ? <p className="text-sm text-muted-foreground">{result.remaining(response.quota.remaining)}</p> : null}
          </div>
          {reading ? (
            <Button type="button" variant="outline" onClick={chooseAnother} className="h-11 w-full text-base sm:w-fit">
              {steps.cancel}
            </Button>
          ) : null}
          {finished ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {response ? (
                <Button
                  type="button"
                  onClick={() => setClosedResponse(null)}
                  className="h-11 w-full text-base hover:bg-primary-hover sm:w-fit"
                >
                  {dialog.reopen}
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={chooseAnother} className="h-11 w-full text-base sm:w-fit">
                {result.another}
              </Button>
            </div>
          ) : null}
        </div>
      )}
      {response ? (
        <ResultDialog
          // Nouvelle identification : fenêtre remise à zéro (vue résultat, signalement possible).
          key={response.identificationId ?? "sans-identifiant"}
          frames={state.status === "ready" ? state.packageBlobs : []}
          open={closedResponse !== response}
          onOpenChange={(open) => setClosedResponse(open ? null : response)}
          response={response}
          onAnother={chooseAnother}
        />
      ) : null}
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
    case "preparing":
      return steps.preparing(state.progress);
    case "extracting":
      return steps.extracting(Math.min(state.frames.length + 1, state.total), state.total);
    case "insufficient":
      return state.mode === "images" ? result.insufficientImages : result.insufficient;
    case "ready":
      if (identification.status === "failed") {
        return failures[identification.failure.kind];
      }
      return identification.status === "done" ? result.ready(state.packageBlobs.length) : steps.analyzing;
    default:
      return "";
  }
}
