"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { AUTH_TEXT } from "@/content/fr/auth";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { IDLE_FORM, PASSWORD_MAX, PASSWORD_MIN } from "@/schemas/auth";

import { fieldError, type FormAction, FormMessage, globalError, PasswordField, SubmitButton } from "./form-parts";

// Nouveau mot de passe, après le lien de réinitialisation (session ouverte par /auth/confirm).
export function NewPasswordForm({ action }: { action: FormAction }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const { fields, newPassword } = AUTH_TEXT;

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4">
        <FormMessage state={state} />
        {/* Rechargement complet voulu : la session vient de s'ouvrir (en-tête, quota). */}
        <Button asChild className="h-11 w-full text-base hover:bg-primary-hover">
          <a href={LAYOUT_TEXT.nav.cta.href}>{newPassword.continue}</a>
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <PasswordField
        name="password"
        label={fields.newPassword}
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        hint={fields.passwordHint}
        error={fieldError(state, "password")}
      />
      <PasswordField
        name="confirmation"
        label={fields.confirmation}
        autoComplete="new-password"
        required
        error={fieldError(state, "confirmation")}
      />
      <FormMessage state={globalError(state)} />
      <SubmitButton label={newPassword.submit} pendingLabel={newPassword.pending} />
    </form>
  );
}
