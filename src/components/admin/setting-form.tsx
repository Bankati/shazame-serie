"use client";

import { useActionState } from "react";

import { type FormAction, fieldError, FormField, FormMessage, globalError, SubmitButton } from "@/components/auth/form-parts";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { IDLE_FORM } from "@/schemas/auth";

type Props = {
  action: FormAction;
  settingKey: keyof typeof ADMIN_TEXT.settings.labels;
  defaultValue: string;
  updatedAt: string;
};

// Un réglage du back-office (U26) : un formulaire par valeur, pour qu'une erreur de saisie n'en bloque pas d'autres.
export function SettingForm({ action, settingKey, defaultValue, updatedAt }: Props) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const text = ADMIN_TEXT.settings;
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:p-6">
      <input type="hidden" name="key" value={settingKey} />
      <FormField
        name="value"
        label={text.labels[settingKey]}
        hint={text.hints[settingKey]}
        inputMode={settingKey === "ai_daily_cap_micro_eur" ? "decimal" : "numeric"}
        required
        defaultValue={defaultValue}
        error={fieldError(state, "value")}
      />
      <p className="text-xs text-muted-foreground">{text.updatedAt(updatedAt)}</p>
      <FormMessage state={state.status === "success" ? state : globalError(state)} />
      <div className="sm:w-fit">
        <SubmitButton label={text.submit} pendingLabel={text.pending} />
      </div>
    </form>
  );
}
