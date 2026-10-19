"use client";

import { X } from "lucide-react";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import type { IdentifyResponse } from "@/schemas/identify";

import { IdentificationResult } from "./identification-result";

// Résultat dans une fenêtre (demande du fondateur, 16 octobre 2026) : centrée sur ordinateur, feuille qui
// glisse du bas sur mobile (ui-context.md, « Modales »). Le focus y entre à l'ouverture et revient au
// panneau à la fermeture ; Échap et le fond assombri la ferment.

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(DESKTOP_QUERY).matches, () => false);
}

type ResultDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: IdentifyResponse;
  onAnother: () => void;
};

export function ResultDialog({ open, onOpenChange, response, onAnother }: ResultDialogProps) {
  const desktop = useIsDesktop();
  const { dialog, result } = IDENTIFY_TEXT;
  const description = result.remaining(response.quota.remaining);

  const body = (
    <>
      <IdentificationResult response={response} />
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="h-11 text-base" onClick={onAnother}>
          {result.another}
        </Button>
      </div>
    </>
  );

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-4 overflow-y-auto p-6 sm:max-w-xl">
          <Header title={dialog.title} description={description} Title={DialogTitle} Description={DialogDescription} Close={DialogClose} />
          {body}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="max-h-[90dvh] gap-4 overflow-y-auto rounded-t-xl p-4">
        <Header title={dialog.title} description={description} Title={SheetTitle} Description={SheetDescription} Close={SheetClose} />
        {body}
      </SheetContent>
    </Sheet>
  );
}

type Slot = React.ComponentType<{ className?: string; children?: React.ReactNode; asChild?: boolean }>;

function Header({
  title,
  description,
  Title,
  Description,
  Close,
}: {
  title: string;
  description: string;
  Title: Slot;
  Description: Slot;
  Close: Slot;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <Title className="font-display text-xl font-bold text-foreground">{title}</Title>
        <Description className="text-sm text-muted-foreground">{description}</Description>
      </div>
      <Close asChild>
        <Button type="button" variant="ghost" size="icon-lg" className="size-11 shrink-0" aria-label={IDENTIFY_TEXT.dialog.close}>
          <X className="size-5" aria-hidden="true" />
        </Button>
      </Close>
    </div>
  );
}
