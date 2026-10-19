"use client";

import { useActionState, useEffect } from "react";

import { reloadAccount } from "@/client/account/account";
import { fieldError, type FormAction, FormField, FormMessage, globalError, SubmitButton } from "@/components/auth/form-parts";
import { ACCOUNT_TEXT } from "@/content/fr/account";
import { IDLE_FORM } from "@/schemas/auth";

const NAME_MAX = 80;

// Nom affiché (U05) : Server Action ; l'en-tête est rechargé une fois le nom enregistré.
export function NameForm({ action, defaultName }: { action: FormAction; defaultName: string }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const { name } = ACCOUNT_TEXT;

  useEffect(() => {
    if (state.status === "success") reloadAccount();
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <FormField
        name="displayName"
        label={name.label}
        autoComplete="name"
        required
        maxLength={NAME_MAX}
        defaultValue={defaultName}
        hint={name.hint}
        error={fieldError(state, "displayName")}
      />
      <FormMessage state={state.status === "success" ? state : globalError(state)} />
      <div className="sm:w-fit">
        <SubmitButton label={name.submit} pendingLabel={name.pending} />
      </div>
    </form>
  );
}
