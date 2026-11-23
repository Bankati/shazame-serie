"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import type { FormAction } from "@/components/auth/form-parts";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { IDLE_FORM } from "@/schemas/auth";

function StatusButton({ suspend }: { suspend: boolean }) {
  const { pending } = useFormStatus();
  const text = ADMIN_TEXT.users.status;
  return (
    <Button type="submit" size="sm" variant={suspend ? "destructive" : "outline"} disabled={pending} aria-disabled={pending} className="min-h-9">
      {pending ? text.pending : suspend ? text.suspend : text.reactivate}
    </Button>
  );
}

// Suspendre / réactiver un compte (U26). Réversible en un clic : pas de confirmation. Le résultat est annoncé
// aux lecteurs d'écran ; la liste est rechargée par le serveur après succès.
export function UserStatusForm({ action, userId, status }: { action: FormAction; userId: string; status: "active" | "suspended" }) {
  const [state, formAction] = useActionState(action, IDLE_FORM);
  const suspend = status === "active";
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="status" value={suspend ? "suspended" : "active"} />
      <StatusButton suspend={suspend} />
      {state.status === "error" ? (
        <p role="alert" className="text-xs text-destructive">
          {state.message}
        </p>
      ) : state.status === "success" ? (
        <p role="status" className="text-xs text-muted-foreground">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
