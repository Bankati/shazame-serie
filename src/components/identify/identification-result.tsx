"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { WatchlistButton } from "@/components/watchlist/watchlist-button";
import { Skeleton } from "@/components/ui/skeleton";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { titlePath } from "@/lib/title-url";
import type { IdentifiedTitle, IdentifyResponse } from "@/schemas/identify";

import { AlternativeList } from "./alternative-list";
import { ConfidenceBadge } from "./confidence-badge";
import { TitlePoster } from "./title-poster";

const MAIN_POSTER_WIDTH = 96;

const keyOf = (title: IdentifiedTitle) => `${title.mediaType}-${title.tmdbId}`;

// Carte de résultat (ui-context.md, « Résultat ») : affiche, titre, année et type, confiance, autres pistes.
// Les actions (fiche U15, liste U18, signalement U20) s'ajouteront dans la zone prévue sous le titre.
export function IdentificationResult({ response }: { response: IdentifyResponse }) {
  const { card, result } = IDENTIFY_TEXT;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  if (!response.main) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-foreground">{result.notRecognized}</p>
        <AlternativeList titles={response.alternatives} heading={card.leads} onSelect={(title) => setSelectedKey(keyOf(title))} />
        {selectedKey ? <SelectedLead response={response} selectedKey={selectedKey} /> : null}
      </div>
    );
  }

  const all = [response.main, ...response.alternatives];
  const shown = all.find((title) => keyOf(title) === selectedKey) ?? response.main;
  const others = all.filter((title) => keyOf(title) !== keyOf(shown));

  return (
    <div className="flex flex-col gap-4">
      <MainTitle title={shown} />
      <AlternativeList titles={others} heading={card.alternatives} onSelect={(title) => setSelectedKey(keyOf(title))} />
    </div>
  );
}

function MainTitle({ title }: { title: IdentifiedTitle }) {
  const { card, result } = IDENTIFY_TEXT;
  return (
    <article className="flex gap-4" aria-label={card.label}>
      <TitlePoster title={title.title} year={title.year} posterPath={title.posterPath} size="w342" width={MAIN_POSTER_WIDTH} />
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="font-display text-2xl leading-tight font-bold">{title.title}</h3>
        <p className="text-sm text-muted-foreground">{card.meta(title.year, card.kind[title.mediaType])}</p>
        <ConfidenceBadge confidence={title.confidence} />
        <p className="sr-only">{result.title(title.title, title.year)}</p>
        {/* Zone d'actions : « Voir la fiche », « Ajouter à ma liste » (U18) ; « Ce n'est pas le bon titre » en U20. */}
        <div className="mt-1 flex flex-wrap gap-2">
          <Button asChild className="h-11 w-fit px-5 text-base hover:bg-primary-hover">
            <Link href={titlePath(title.mediaType, title.tmdbId, title.title)}>{card.viewTitle}</Link>
          </Button>
          <WatchlistButton item={{ tmdbId: title.tmdbId, mediaType: title.mediaType }} />
        </div>
      </div>
    </article>
  );
}

/** Sans résultat principal : la piste choisie s'affiche comme une carte, avec son pourcentage. */
function SelectedLead({ response, selectedKey }: { response: IdentifyResponse; selectedKey: string }) {
  const lead = response.alternatives.find((title) => keyOf(title) === selectedKey);
  return lead ? <MainTitle title={lead} /> : null;
}

/** Squelette aux dimensions finales pendant l'analyse (pas de saut de mise en page). */
export function IdentificationResultSkeleton() {
  return (
    <div className="flex gap-4" aria-hidden="true">
      <Skeleton className="h-36 w-24 shrink-0 rounded-poster" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-7 w-40" />
      </div>
    </div>
  );
}
