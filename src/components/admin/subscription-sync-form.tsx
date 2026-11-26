"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";

import type { FormAction } from "@/components/auth/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { IDLE_FORM } from "@/schemas/auth";

function SubmitButton() {
  const { pending } = useFormStatus();
  const text = ADMIN_TEXT.subscription.sync;
  return (
    <Button type="submit" variant="outline" className="h-11 self-start" disabled={pending} aria-disabled={pending}>
      {pending ? text.pending : text.submit}
    </Button>
  );
}

// Correction d'un abonnement (U26c) : relu chez Stripe, jamais saisi à la main (invariant 5). L'identifiant
// sub_ est facultatif quand un abonnement est déjà connu ; la page est relue par le serveur après succès.
export function SubscriptionSyncForm({ action, userId }: { action: FormAction; userId: string }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const ids = { input: useId(), hint: useId(), error: useId() };
  const text = ADMIN_TEXT.subscription.sync;
  const fieldError = state.status === "error" ? state.fields?.subscriptionId : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="userId" value={userId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor={ids.input}>{text.idLabel}</Label>
        <Input
          id={ids.input}
          name="subscriptionId"
          autoComplete="off"
          spellCheck={false}
          maxLength={255}
          placeholder="sub_…"
          aria-describedby={fieldError ? `${ids.hint} ${ids.error}` : ids.hint}
          aria-invalid={fieldError ? true : undefined}
          className="h-11 font-mono text-base"
        />
        <p id={ids.hint} className="text-xs text-muted-foreground">
          {text.idHint}
        </p>
      </div>
      <SubmitButton />
      {state.status === "error" ? (
        <p id={ids.error} role="alert" className="text-sm text-destructive">
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
