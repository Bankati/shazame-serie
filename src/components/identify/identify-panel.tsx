"use client";

import { Lock } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { type ExtractionState, useFrameExtraction } from "@/client/frames/use-frame-extraction";
import { useDescriptionIdentification, useLinkIdentification } from "@/client/identify/use-description";
import { publishQuota } from "@/client/identify/quota";
import type { IdentifyFailure } from "@/client/identify/send-frames";
import { type IdentificationState, useIdentification } from "@/client/identify/use-identification";
import { PAUSE_ATTRIBUTE } from "@/components/decor/curved-film-band";
import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import type { IdentifyResponse, QuotaInfo } from "@/schemas/identify";

import { ClipDropzone } from "./clip-dropzone";
import { DescriptionForm } from "./description-form";
import { ExcerptPicker } from "./excerpt-picker";
import { FilmStrip } from "./film-strip";
import { IdentificationResultSkeleton } from "./identification-result";
import { type IdentifyTab, IdentifyTabs } from "./identify-tabs";
import { LinkForm } from "./link-form";
import { ResultDialog } from "./result-dialog";

// Carte d'identification de l'accueil : onglets « Vidéo ou captures » (extraction locale U06, U33, U34),
// « Description » (U35) et « Lien » (U36). Résultat dans une fenêtre (U12). Le compteur de l'en-tête suit le quota.
export function IdentifyPanel() {
  // Changement d'onglet : le focus reste sur l'onglet (modèle WAI-ARIA) ; Tab mène ensuite au contenu.
  const [tab, setTab] = useState<IdentifyTab>("media");
  const panelId = useId();
  const { dropzone, description, link } = IDENTIFY_TEXT;

  return (
    // min-w-0 : élément de grille du hero, il ne doit pas s'élargir pour contenir la pellicule.
    <div className="flex min-w-0 flex-col gap-4 rounded-xl bg-card p-4 text-card-foreground shadow-lg md:p-6">
      <IdentifyTabs value={tab} panelId={panelId} onChange={setTab} />
      <div role="tabpanel" id={panelId} aria-labelledby={`${panelId}-${tab}`}>
        {tab === "media" ? <MediaIdentify /> : <QueryIdentify key={tab} kind={tab} />}
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        {tab === "media" ? dropzone.privacy : tab === "description" ? description.privacy : link.privacy}
      </p>
    </div>
  );
}

/** Fenêtre de résultat : s'ouvre d'elle-même à chaque nouveau résultat ; fermée, elle se rouvre par un bouton. */
function useResultDialog(response: IdentifyResponse | null) {
  const [closedResponse, setClosedResponse] = useState<IdentifyResponse | null>(null);
  return {
    open: response !== null && closedResponse !== response,
    reopen: () => setClosedResponse(null),
    close: () => setClosedResponse(response),
    onOpenChange: (open: boolean) => setClosedResponse(open ? null : response),
  };
}

function usePublishQuota(response: IdentifyResponse | null, failure: IdentifyFailure | null) {
  useEffect(() => {
    const quota: QuotaInfo | null = response?.quota ?? (failure?.kind === "quota" ? failure.quota : null);
    if (quota) publishQuota(quota);
  }, [response, failure]);
}

function MediaIdentify() {
  const { state, start, choose, reset } = useFrameExtraction();
  const identification = useIdentification(
    state.status === "ready" ? state.packageBlobs : null,
    state.status === "ready" ? state.mode : "clip",
  );
  const { result, dialog, steps } = IDENTIFY_TEXT;
  const response = identification.status === "done" ? identification.response : null;
  usePublishQuota(response, identification.status === "failed" ? identification.failure : null);
  const resultDialog = useResultDialog(response);

  // Après « Choisir un autre clip », la zone d'envoi remplace la pellicule : le focus doit la suivre.
  const [returningFromResult, setReturningFromResult] = useState(false);
  const chooseAnother = () => {
    setReturningFromResult(true);
    resultDialog.close();
    reset();
  };

  const showDropzone = state.status === "idle" || state.status === "rejected";
  // Lecture longue possible (lecteur de secours de 32 Mo en 4G, grosse vidéo) : on peut toujours renoncer.
  const reading = state.status === "reading" || state.status === "preparing" || state.status === "extracting";
  const finished =
    state.status === "insufficient" || (state.status === "ready" && identification.status !== "sending" && identification.status !== "idle");

  return (
    // Bandeau du hero en pause pendant l'analyse : l'extraction des images garde tout le processeur.
    <div {...(showDropzone ? {} : { [PAUSE_ATTRIBUTE]: "" })}>
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
                <Button type="button" onClick={resultDialog.reopen} className="h-11 w-full text-base hover:bg-primary-hover sm:w-fit">
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
          open={resultDialog.open}
          onOpenChange={resultDialog.onOpenChange}
          response={response}
          onAnother={chooseAnother}
        />
      ) : null}
    </div>
  );
}

/** Recherche par texte saisi : description (U35) ou lien (U36). Même parcours, formulaire et libellés propres. */
function QueryIdentify({ kind }: { kind: "description" | "link" }) {
  const description = useDescriptionIdentification();
  const link = useLinkIdentification();
  const { state, submit, reset } = kind === "description" ? description : link;
  const { result, dialog, failures } = IDENTIFY_TEXT;
  const Form = kind === "description" ? DescriptionForm : LinkForm;
  const response = state.status === "done" ? state.response : null;
  usePublishQuota(response, state.status === "failed" ? state.failure : null);
  const resultDialog = useResultDialog(response);
  // Formulaire remonté à chaque « Décrire un autre titre » : champ vidé et focus rendu.
  const [round, setRound] = useState(0);

  const describeAnother = () => {
    resultDialog.close();
    reset();
    setRound((value) => value + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      {state.status === "done" ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" onClick={resultDialog.reopen} className="h-11 w-full text-base hover:bg-primary-hover sm:w-fit">
            {dialog.reopen}
          </Button>
          <Button type="button" variant="outline" onClick={describeAnother} className="h-11 w-full text-base sm:w-fit">
            {IDENTIFY_TEXT[kind].another}
          </Button>
        </div>
      ) : (
        <Form
          key={round}
          onSubmit={(text) => void submit(text)}
          sending={state.status === "sending"}
          focusOnMount={round > 0}
        />
      )}
      <div aria-live="polite" className="flex flex-col gap-2">
        {state.status === "sending" ? <IdentificationResultSkeleton /> : null}
        {state.status === "failed" ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {failures[state.failure.kind]}
          </p>
        ) : null}
        {response ? <p className="text-sm text-muted-foreground">{result.remaining(response.quota.remaining)}</p> : null}
      </div>
      {response ? (
        <ResultDialog
          key={response.identificationId ?? "sans-identifiant"}
          // Aucune image : le signalement ne propose pas d'en joindre (RG8).
          frames={[]}
          source={kind}
          open={resultDialog.open}
          onOpenChange={resultDialog.onOpenChange}
          response={response}
          onAnother={describeAnother}
        />
      ) : null}
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
