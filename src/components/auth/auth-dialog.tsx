"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AUTH_TEXT } from "@/content/fr/auth";

// Fenêtre de connexion (U41, AD-47) : ouverte par une navigation dans le site (route interceptée `@modal`), par-dessus
// la page en cours. La fermer revient en arrière dans l'historique : on retrouve la page, l'adresse redevient la
// sienne. Focus piégé, Échap et clic à l'extérieur gérés par le composant Dialog (Radix).
export function AuthDialog({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  const router = useRouter();

  return (
    <Dialog defaultOpen onOpenChange={(open) => (open ? undefined : router.back())}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-6 overflow-y-auto p-6 sm:max-w-md">
        <DialogHeader className="flex-row items-start justify-between gap-4 text-left">
          <div className="flex flex-col gap-2">
            <DialogTitle className="font-display text-display font-bold">{title}</DialogTitle>
            {description ? <DialogDescription className="text-base text-muted-foreground">{description}</DialogDescription> : null}
          </div>
          <DialogClose
            className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            aria-label={AUTH_TEXT.dialog.close}
          >
            <X className="size-5" aria-hidden="true" />
          </DialogClose>
        </DialogHeader>
        <div className="flex flex-col gap-6">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
