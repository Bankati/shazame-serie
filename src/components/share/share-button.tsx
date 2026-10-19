"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { shareLink } from "@/client/share/share";
import { Button } from "@/components/ui/button";
import { SHARE_TEXT } from "@/content/fr/share";
import { cn } from "@/lib/utils";

// « Partager » (U19, CDC 12.5) : lien public vers la fiche, ouvert sans compte, avec sa carte d'aperçu.
// Téléphone : feuille de partage native (WhatsApp, Instagram…) ; ordinateur : lien copié.
export function ShareButton({
  path,
  title,
  tone = "default",
  className,
}: {
  /** Chemin de la fiche (« /titre/film/603-matrix »). */
  path: string;
  title: string;
  tone?: "default" | "inverse";
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    setBusy(true);
    const url = new URL(path, window.location.origin).toString();
    const outcome = await shareLink({ title, text: SHARE_TEXT.message(title), url });
    setBusy(false);
    if (outcome === "copied") toast.success(SHARE_TEXT.copied);
    if (outcome === "failed") toast.error(SHARE_TEXT.failed);
  };

  return (
    <Button
      type="button"
      variant="outline"
      disabled={busy}
      onClick={onClick}
      className={cn(
        "h-11 gap-2 px-4 text-base",
        tone === "inverse" && "border-inverse-foreground/40 bg-transparent text-inverse-foreground",
        className,
      )}
    >
      <Share2 className="size-5" aria-hidden="true" />
      {SHARE_TEXT.button}
    </Button>
  );
}
