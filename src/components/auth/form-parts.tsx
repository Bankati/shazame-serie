"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useFormStatus } from "react-dom";

import { navigateAfterSessionChange } from "@/client/account/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AUTH_TEXT } from "@/content/fr/auth";
import { cn } from "@/lib/utils";
import type { FormState } from "@/schemas/auth";

// Briques communes des formulaires de compte (U04) : champ, mot de passe, bouton d'envoi, message.

export type FormAction = (state: FormState, form: FormData) => Promise<FormState>;

const INPUT_CLASS = "h-11 rounded-md px-3 text-base";

type FieldProps = {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  /** Élément posé à droite dans le champ (bouton afficher / masquer). */
  trailing?: React.ReactNode;
} & Omit<React.ComponentProps<typeof Input>, "name" | "id">;

export function FormField({ name, label, error, hint, trailing, className, ...input }: FieldProps) {
  const id = useId();
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={cn(INPUT_CLASS, trailing ? "pr-12" : null, className)}
          {...input}
        />
        {trailing ? <div className="absolute inset-y-0 right-0 flex items-center">{trailing}</div> : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField(props: Omit<FieldProps, "type">) {
  const [visible, setVisible] = useState(false);
  const { fields } = AUTH_TEXT;
  return (
    <FormField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="size-11"
          aria-label={visible ? fields.hidePassword : fields.showPassword}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </Button>
      }
    />
  );
}

export function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending} className="h-11 w-full text-base hover:bg-primary-hover">
      {pending ? pendingLabel : label}
    </Button>
  );
}

/** Message global du formulaire : erreur (role alert) ou confirmation (role status). */
export function FormMessage({ state }: { state: FormState }) {
  if (state.status === "error") {
    return (
      <p role="alert" className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
        {state.message}
      </p>
    );
  }
  if (state.status === "success") {
    return (
      <p role="status" className="rounded-md bg-brand-subtle p-3 text-sm text-brand-subtle-foreground">
        {state.message}
      </p>
    );
  }
  return null;
}

/** Redirection demandée par le serveur après un changement de session (compte et quota rechargés). */
export function useRedirect(state: FormState): void {
  useEffect(() => {
    if (state.status === "redirect") {
      navigateAfterSessionChange(state.to);
    }
  }, [state]);
}

export function fieldError(state: FormState, name: string): string | undefined {
  return state.status === "error" ? state.fields?.[name] : undefined;
}

/** Erreur sans champ précis (identifiants refusés, limite atteinte) : affichée au-dessus du bouton. */
export function globalError(state: FormState): FormState {
  return state.status === "error" && !Object.keys(state.fields ?? {}).length ? state : { status: "idle" };
}

export function previousEmail(state: FormState): string | undefined {
  return state.status === "error" ? state.email : undefined;
}
