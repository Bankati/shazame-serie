import { Lock, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HOME_TEXT } from "@/content/fr/home";

// Aperçu statique de la zone d'envoi. Remplacé par ClipDropzone (U06), qui gère le fichier.
export function ClipDropzonePreview() {
  const { dropzone } = HOME_TEXT;

  return (
    <div className="rounded-xl bg-card p-4 text-card-foreground shadow-lg md:p-6">
      <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-input px-4 py-8 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-muted">
          <Upload className="size-6 text-primary" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-display text-2xl font-bold">{dropzone.title}</p>
          <p className="text-sm text-muted-foreground">{dropzone.constraints}</p>
        </div>
        <Button disabled aria-describedby="dropzone-coming-soon" className="h-11 w-full max-w-xs text-base">
          {dropzone.button}
        </Button>
        <p id="dropzone-coming-soon" className="text-sm font-medium text-foreground">
          {dropzone.comingSoon}
        </p>
      </div>
      <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-brand-strong" aria-hidden="true" />
        {dropzone.privacy}
      </p>
    </div>
  );
}
