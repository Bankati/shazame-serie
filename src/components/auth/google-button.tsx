"use client";

import { useActionState } from "react";

import { AUTH_TEXT } from "@/content/fr/auth";
import { IDLE_FORM } from "@/schemas/auth";

import { type FormAction, FormMessage, useRedirect } from "./form-parts";
import { GoogleSubmit } from "./google-submit";
import { LegalLinks } from "./legal-links";

// « Continuer avec Google » (U04) : la Server Action renvoie l'adresse d'autorisation, le navigateur y part.
// La mention d'acceptation des textes est affichée juste sous le bouton (décision 4).
export function GoogleButton({ action, next }: { action: FormAction; next?: string }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  useRedirect(state);
  const { google } = AUTH_TEXT;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <GoogleSubmit label={google.button} pendingLabel={google.pending} />
      <p className="text-sm text-muted-foreground">
        <LegalLinks parts={google.consent} />
      </p>
      <FormMessage state={state} />
    </form>
  );
}
