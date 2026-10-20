"use client";

import { Check, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { REPORT_TEXT } from "@/content/fr/report";
import { cn } from "@/lib/utils";
import { type CatalogSearchResult, catalogSearchResponseSchema } from "@/schemas/report";

import { TitlePoster } from "./title-poster";

const SEARCH_DELAY_MS = 350;
const searchResponse = z.object({ ok: z.literal(true), data: catalogSearchResponseSchema });
const errorResponse = z.object({ ok: z.literal(false), error: z.object({ code: z.string() }) });

type SearchState = { status: "idle" } | { status: "loading" } | { status: "ready"; results: CatalogSearchResult[] } | { status: "error" };

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
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const [selected, setSelected] = useState<CatalogSearchResult | null>(null);
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const ids = { search: useId(), consent: useId(), hint: useId() };
  const text = REPORT_TEXT;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearch({ status: "loading" });
      fetch(`/api/catalog/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((body: unknown) => {
          const parsed = searchResponse.safeParse(body);
          setSearch(parsed.success ? { status: "ready", results: parsed.data.data.results } : { status: "error" });
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearch({ status: "error" });
        });
    }, SEARCH_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

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

  // Moins de deux caractères : aucune recherche en cours, rien d'affiché.
  const active = query.trim().length >= 2;
  const results = active && search.status === "ready" ? search.results : [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-display text-xl font-bold text-foreground">{text.title}</h3>
        <p className="text-sm text-muted-foreground">{text.description}</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={ids.search} className="text-sm font-medium text-foreground">
          {text.search.label}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id={ids.search}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.search.placeholder}
            autoComplete="off"
            maxLength={100}
            className="h-11 rounded-md pr-3 pl-9 text-base"
          />
        </div>
        <div aria-live="polite" className="flex flex-col gap-2">
          {active && search.status === "loading" ? <p className="text-sm text-muted-foreground">{text.search.loading}</p> : null}
          {active && search.status === "error" ? <p className="text-sm text-muted-foreground">{text.search.unavailable}</p> : null}
          {active && search.status === "ready" && results.length === 0 ? <p className="text-sm text-muted-foreground">{text.search.none}</p> : null}
          {selected ? <p className="sr-only">{text.search.selected(selected.title)}</p> : null}
        </div>
        {results.length > 0 ? (
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {results.map((result) => {
              const chosen = selected?.tmdbId === result.tmdbId && selected.mediaType === result.mediaType;
              return (
                <li key={`${result.mediaType}-${result.tmdbId}`}>
                  <button
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => setSelected(chosen ? null : result)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md border border-border bg-card p-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                      chosen && "border-brand-strong",
                    )}
                  >
                    <TitlePoster title={result.title} year={result.year} posterPath={result.posterPath} size="w92" width={36} alt="" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-semibold text-foreground">{result.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {[text.search.kind[result.mediaType], result.year].filter(Boolean).join(", ")}
                      </span>
                    </span>
                    {chosen ? <Check className="size-5 shrink-0 text-brand-strong" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>

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
