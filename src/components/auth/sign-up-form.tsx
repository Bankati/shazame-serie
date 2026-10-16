"use client";

import { useActionState, useId } from "react";

import { AUTH_TEXT } from "@/content/fr/auth";
import { EMAIL_MAX, IDLE_FORM, PASSWORD_MAX, PASSWORD_MIN } from "@/schemas/auth";

import {
  fieldError,
  type FormAction,
  FormField,
  FormMessage,
  globalError,
  PasswordField,
  previousEmail,
  SubmitButton,
} from "./form-parts";
import { LegalLinks } from "./legal-links";

// Inscription par email (CDC 13.2, étape 2a). Case d'acceptation non cochée par défaut.
export function SignUpForm({ action }: { action: FormAction }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const { fields, signUp } = AUTH_TEXT;
  const acceptId = useId();
  const acceptError = fieldError(state, "accept");

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
      <PasswordField
        name="password"
        label={fields.password}
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN}
        maxLength={PASSWORD_MAX}
        hint={fields.passwordHint}
        error={fieldError(state, "password")}
      />
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <input
            id={acceptId}
            name="accept"
            type="checkbox"
            required
            aria-invalid={acceptError ? true : undefined}
            aria-describedby={acceptError ? `${acceptId}-error` : undefined}
            className="mt-0.5 size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          <label htmlFor={acceptId} className="text-sm text-foreground">
            <LegalLinks parts={signUp.accept} />
          </label>
        </div>
        {acceptError ? (
          <p id={`${acceptId}-error`} className="text-sm text-destructive">
            {acceptError}
          </p>
        ) : null}
      </div>
      <FormMessage state={globalError(state)} />
      <SubmitButton label={signUp.submit} pendingLabel={signUp.pending} />
    </form>
  );
}
