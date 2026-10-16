"use client";

import Link from "next/link";
import { useActionState } from "react";

import { AUTH_TEXT } from "@/content/fr/auth";
import { EMAIL_MAX, IDLE_FORM } from "@/schemas/auth";

import {
  fieldError,
  type FormAction,
  FormField,
  FormMessage,
  globalError,
  PasswordField,
  previousEmail,
  SubmitButton,
  useRedirect,
} from "./form-parts";

// Connexion par email (20 tentatives par heure et par IP, appliqué par le serveur).
export function SignInForm({ action, next }: { action: FormAction; next?: string }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  useRedirect(state);
  const { fields, signIn } = AUTH_TEXT;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
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
        autoComplete="current-password"
        required
        error={fieldError(state, "password")}
      />
      <Link
        href="/mot-de-passe-oublie"
        className="flex min-h-11 w-fit items-center text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {signIn.forgot}
      </Link>
      <FormMessage state={globalError(state)} />
      <SubmitButton label={signIn.submit} pendingLabel={signIn.pending} />
    </form>
  );
}
