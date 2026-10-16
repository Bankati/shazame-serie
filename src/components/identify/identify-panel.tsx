"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import { type ExtractionState, useFrameExtraction } from "@/client/frames/use-frame-extraction";
import { type IdentificationState, useIdentification } from "@/client/identify/use-identification";
import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import type { IdentifyResponse } from "@/schemas/identify";

import { ClipDropzone } from "./clip-dropzone";
import { FilmStrip } from "./film-strip";

// Carte d'identification de l'accueil : choix du clip, extraction locale (U06), envoi des images et
// résultat en texte (U11). La carte de résultat complète (affiche, actions, signalement) arrive en U12.
export function IdentifyPanel() {
  const { state, start, reset } = useFrameExtraction();
  const identification = useIdentification(state.status === "ready" ? state.packageBlobs : null);
  const { dropzone, result } = IDENTIFY_TEXT;
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
            {identification.status === "done" ? <ResultText response={identification.response} /> : null}
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

function ResultText({ response }: { response: IdentifyResponse }) {
  const { result } = IDENTIFY_TEXT;
  const { main, alternatives, decision, quota } = response;

  return (
    <div className="flex flex-col gap-2">
      {main && decision !== "ask_another_clip" ? (
        <p className="flex flex-col">
          <span className="font-display text-xl font-bold">{result.title(main.title, main.year)}</span>
          <span className="text-sm text-muted-foreground">{result.confidence(main.confidence, decision)}</span>
        </p>
      ) : (
        <p className="text-sm text-foreground">{result.notRecognized}</p>
      )}
      {alternatives.length > 0 ? (
        <div className="text-sm text-muted-foreground">
          <p>{result.alternatives}</p>
          <ul className="list-inside list-disc">
            {alternatives.map((title) => (
              <li key={`${title.mediaType}-${title.tmdbId}`}>
                {result.title(title.title, title.year)}, {title.confidence}&nbsp;%
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p className="text-sm text-muted-foreground">{result.remaining(quota.remaining)}</p>
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
