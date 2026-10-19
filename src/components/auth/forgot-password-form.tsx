"use client";

import { useActionState } from "react";

import { AUTH_TEXT } from "@/content/fr/auth";
import { EMAIL_MAX, IDLE_FORM } from "@/schemas/auth";

import { fieldError, type FormAction, FormField, FormMessage, globalError, previousEmail, SubmitButton } from "./form-parts";

// Mot de passe oublié : même réponse que l'adresse ait un compte ou non.
export function ForgotPasswordForm({ action }: { action: FormAction }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const { fields, forgotPassword } = AUTH_TEXT;

  if (state.status === "success") {
    return <FormMessage state={state} />;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField
        name="email"
        label={fields.email}
        type="email"
        autoComplete="email"
        required
        maxLength={EMAIL_MAX}
        defaultValue={previousEmail(state)}
        error={fieldError(state, "email")}
      />
      <FormMessage state={globalError(state)} />
      <SubmitButton label={forgotPassword.submit} pendingLabel={forgotPassword.pending} />
    </form>
  );
}
