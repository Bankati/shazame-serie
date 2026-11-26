"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import type { FormAction } from "@/components/auth/form-parts";
import { CatalogTitlePicker } from "@/components/identify/catalog-title-picker";
import { Button } from "@/components/ui/button";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { REPORT_TEXT } from "@/content/fr/report";
import { IDLE_FORM } from "@/schemas/auth";
import type { CatalogSearchResult } from "@/schemas/report";

type TitleChoice = { tmdbId: number; mediaType: "movie" | "tv"; label: string };
type Choice = "proposed" | "suggested" | "other";

const RADIO =
  "mt-0.5 size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const text = ADMIN_TEXT.reports.review;
  return (
    <Button type="submit" className="h-11 self-start text-base" disabled={pending || disabled} aria-disabled={pending || disabled}>
      {pending ? text.pending : text.submit}
    </Button>
  );
}

// Revue d'un signalement (U26b) : l'admin retient le bon titre (proposé, suggéré ou cherché dans TMDB) et peut
// l'ajouter au jeu de test s'il a des images. Le serveur revérifie le titre et le statut avant d'écrire.
export function ReportReviewForm({
  action,
  reportId,
  proposed,
  suggested,
  hasImages,
}: {
  action: FormAction;
  reportId: string;
  proposed: TitleChoice | null;
  suggested: TitleChoice | null;
  hasImages: boolean;
}) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const [choice, setChoice] = useState<Choice>(suggested ? "suggested" : proposed ? "proposed" : "other");
  const [other, setOther] = useState<CatalogSearchResult | null>(null);
  const ids = { proposed: useId(), suggested: useId(), other: useId(), eval: useId(), evalHint: useId() };
  const text = ADMIN_TEXT.reports.review;

  const retained = choice === "proposed" ? proposed : choice === "suggested" ? suggested : other;
  // Une fois la décision enregistrée, la page est rechargée par le serveur (signalement clos).
  const done = state.status === "success";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="reportId" value={reportId} />
      {retained ? (
        <>
          <input type="hidden" name="tmdbId" value={retained.tmdbId} />
          <input type="hidden" name="mediaType" value={retained.mediaType} />
        </>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-base font-semibold text-foreground">{text.legend}</legend>
        {proposed ? (
          <div className="flex items-start gap-3">
            <input id={ids.proposed} type="radio" name="choice" checked={choice === "proposed"} onChange={() => setChoice("proposed")} className={RADIO} />
            <label htmlFor={ids.proposed} className="text-sm text-foreground">
              {text.proposed} <span className="text-muted-foreground">({proposed.label})</span>
            </label>
          </div>
        ) : null}
        {suggested ? (
          <div className="flex items-start gap-3">
            <input id={ids.suggested} type="radio" name="choice" checked={choice === "suggested"} onChange={() => setChoice("suggested")} className={RADIO} />
            <label htmlFor={ids.suggested} className="text-sm text-foreground">
              {text.suggested} <span className="text-muted-foreground">({suggested.label})</span>
            </label>
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <input id={ids.other} type="radio" name="choice" checked={choice === "other"} onChange={() => setChoice("other")} className={RADIO} />
          <label htmlFor={ids.other} className="text-sm text-foreground">
            {text.other}
          </label>
        </div>
        {choice === "other" ? (
          <div className="pl-8">
            <CatalogTitlePicker
              text={{ ...REPORT_TEXT.search, label: text.searchLabel, placeholder: text.searchPlaceholder }}
              selected={other}
              onSelect={setOther}
            />
          </div>
        ) : null}
      </fieldset>

      <div className="flex flex-col gap-1">
        <div className="flex items-start gap-3">
          <input
            id={ids.eval}
            type="checkbox"
            name="addToEval"
            disabled={!hasImages}
            aria-describedby={ids.evalHint}
            className={RADIO}
          />
          <label htmlFor={ids.eval} className="text-sm text-foreground">
            {text.addToEval}
          </label>
        </div>
        <p id={ids.evalHint} className="pl-8 text-sm text-muted-foreground">
          {hasImages ? text.addToEvalHint : text.addToEvalNoImages}
        </p>
      </div>

      {!retained ? <p className="text-sm text-muted-foreground">{text.chooseFirst}</p> : null}
      <SubmitButton disabled={!retained || done} />

      {state.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : state.status === "success" ? (
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
