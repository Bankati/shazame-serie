"use client";

import { useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { REPORT_TEXT } from "@/content/fr/report";
import type { CatalogSearchResult } from "@/schemas/report";

import { CatalogTitlePicker } from "./catalog-title-picker";

const errorResponse = z.object({ ok: z.literal(false), error: z.object({ code: z.string() }) });

// Signalement d'erreur (U20, RG8) : bon titre facultatif (recherche TMDB), consentement aux images non coché
// par défaut. Les images (encore en mémoire dans le navigateur) ne partent qu'avec ce consentement.
export function ReportForm({
  identificationId,
  frames,
  onDone,
  onCancel,
}: {
  identificationId: string;
  frames: readonly Blob[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<CatalogSearchResult | null>(null);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const ids = { consent: useId(), hint: useId() };
  const text = REPORT_TEXT;

  const submit = async () => {
    setSending(true);
    const body = new FormData();
    body.set("identificationId", identificationId);
    body.set("imagesConsent", consent ? "true" : "false");
    if (selected) {
      body.set("correctedTmdbId", String(selected.tmdbId));
      body.set("correctedMediaType", selected.mediaType);
    }
    // RG8 : les images ne quittent le navigateur qu'avec le consentement.
    if (consent) frames.forEach((frame, index) => body.append("frames", frame, `image-${index + 1}.jpg`));
    try {
      const response = await fetch("/api/reports", { method: "POST", body });
      const json: unknown = await response.json();
      if (response.ok) {
        toast.success(text.thanks);
        onDone();
        return;
      }
      const failure = errorResponse.safeParse(json);
      const code = failure.success ? failure.data.error.code : null;
      toast.error(code === "RATE_LIMITED" ? text.failures.rate_limited : code === "NOT_FOUND" ? text.failures.not_found : text.failures.unavailable);
    } catch {
      toast.error(text.failures.unavailable);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-bold text-foreground">{text.title}</h3>
        <p className="text-sm text-muted-foreground">{text.description}</p>
      </div>

      <CatalogTitlePicker text={text.search} selected={selected} onSelect={setSelected} />

      {frames.length > 0 ? (
        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-3">
            <input
              id={ids.consent}
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              aria-describedby={ids.hint}
              className="mt-0.5 size-5 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            />
            <label htmlFor={ids.consent} className="text-sm text-foreground">
              {text.consent.label}
            </label>
          </div>
          <p id={ids.hint} className="pl-8 text-sm text-muted-foreground">
            {text.consent.hint}
          </p>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" className="h-11 text-base" onClick={onCancel} disabled={sending}>
          {text.cancel}
        </Button>
        <Button type="button" className="h-11 text-base hover:bg-primary-hover" onClick={submit} disabled={sending}>
          {sending ? text.pending : text.submit}
        </Button>
      </div>
    </div>
  );
}
