"use client";

import { Check, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type CatalogSearchResult, catalogSearchResponseSchema } from "@/schemas/report";

import { TitlePoster } from "./title-poster";

const SEARCH_DELAY_MS = 350;
const searchResponse = z.object({ ok: z.literal(true), data: catalogSearchResponseSchema });

type SearchState = { status: "idle" } | { status: "loading" } | { status: "ready"; results: CatalogSearchResult[] } | { status: "error" };

export type CatalogTitlePickerText = {
  label: string;
  placeholder: string;
  loading: string;
  none: string;
  unavailable: string;
  kind: { movie: string; tv: string };
  selected: (title: string) => string;
};

// Recherche d'un titre TMDB (GET /api/catalog/search) et choix d'un résultat. Partagé par le signalement
// (U20) et la revue des signalements du back-office (U26b). Un second clic sur le titre choisi le désélectionne.
export function CatalogTitlePicker({
  text,
  selected,
  onSelect,
}: {
  text: CatalogTitlePickerText;
  selected: CatalogSearchResult | null;
  onSelect: (result: CatalogSearchResult | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const searchId = useId();

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

  // Moins de deux caractères : aucune recherche en cours, rien d'affiché.
  const active = query.trim().length >= 2;
  const results = active && search.status === "ready" ? search.results : [];

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={searchId} className="text-sm font-medium text-foreground">
        {text.label}
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={text.placeholder}
          autoComplete="off"
          maxLength={100}
          className="h-11 rounded-md pr-3 pl-9 text-base"
        />
      </div>
      <div aria-live="polite" className="flex flex-col gap-2">
        {active && search.status === "loading" ? <p className="text-sm text-muted-foreground">{text.loading}</p> : null}
        {active && search.status === "error" ? <p className="text-sm text-muted-foreground">{text.unavailable}</p> : null}
        {active && search.status === "ready" && results.length === 0 ? <p className="text-sm text-muted-foreground">{text.none}</p> : null}
        {selected ? <p className="sr-only">{text.selected(selected.title)}</p> : null}
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
                  onClick={() => onSelect(chosen ? null : result)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border border-border bg-card p-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    chosen && "border-brand-strong",
                  )}
                >
                  <TitlePoster title={result.title} year={result.year} posterPath={result.posterPath} size="w92" width={36} alt="" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-semibold text-foreground">{result.title}</span>
                    <span className="text-sm text-muted-foreground">{[text.kind[result.mediaType], result.year].filter(Boolean).join(", ")}</span>
                  </span>
                  {chosen ? <Check className="size-5 shrink-0 text-brand-strong" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
