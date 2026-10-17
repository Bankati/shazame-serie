"use client";

import { ExternalLink } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { z } from "zod";

import { Skeleton } from "@/components/ui/skeleton";
import { TITLE_TEXT } from "@/content/fr/title";
import { ACCESS_TYPES, type WatchAvailability, watchAvailabilitySchema } from "@/schemas/watch";

// « Où regarder » (U16) : chargé dans le navigateur, car il dépend du pays du visiteur alors que la fiche
// est la même pour tous (mise en cache). Pays déduit par Vercel, modifiable par l'utilisateur.

const LOGO_BASE = "https://image.tmdb.org/t/p/w92";
const responseSchema = z.object({ ok: z.literal(true), data: watchAvailabilitySchema });

type State = { status: "loading" } | { status: "error" } | { status: "ready"; availability: WatchAvailability };

export function WatchProviders({ mediaType, tmdbId }: { mediaType: "movie" | "tv"; tmdbId: number }) {
  const [requestedCountry, setRequestedCountry] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "loading" });
  const { watch } = TITLE_TEXT;
  const selectId = useId();
  const countryNames = useMemo(() => new Intl.DisplayNames(["fr"], { type: "region" }), []);

  useEffect(() => {
    const controller = new AbortController();
    const query = requestedCountry ? `?country=${requestedCountry}` : "";
    fetch(`/api/titles/${mediaType}/${tmdbId}/watch${query}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((body: unknown) => {
        const parsed = responseSchema.safeParse(body);
        setState(parsed.success ? { status: "ready", availability: parsed.data.data } : { status: "error" });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: "error" });
        }
      });
    return () => controller.abort();
  }, [mediaType, tmdbId, requestedCountry]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        <Skeleton className="h-11 w-48" />
        <Skeleton className="h-12 w-full max-w-xl" />
      </div>
    );
  }
  if (state.status === "error") {
    return <p className="text-sm text-muted-foreground">{watch.unavailable}</p>;
  }

  const { availability } = state;
  const name = (code: string) => countryNames.of(code) ?? code;
  const groups = ACCESS_TYPES.filter((type) => availability.offers[type].length > 0);
  // Le pays affiché figure toujours dans la liste, même sans données (ex. Togo).
  const options = [...new Set([availability.country, ...availability.countries])].sort((a, b) => name(a).localeCompare(name(b), "fr"));

  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <div className="flex flex-col gap-1">
        <label htmlFor={selectId} className="text-sm font-medium text-foreground">
          {watch.country}
        </label>
        <select
          id={selectId}
          value={availability.country}
          onChange={(event) => {
            setState({ status: "loading" });
            setRequestedCountry(event.target.value);
          }}
          className="h-11 w-full max-w-xs rounded-md border border-input bg-card px-3 text-base text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {options.map((code) => (
            <option key={code} value={code}>
              {name(code)}
            </option>
          ))}
        </select>
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-base text-foreground">{watch.none(name(availability.country))}</p>
          <p className="text-sm text-muted-foreground">{watch.tryAnother}</p>
        </div>
      ) : (
        <dl className="flex flex-col gap-4">
          {groups.map((type) => (
            <div key={type} className="flex flex-col gap-2">
              <dt className="text-sm font-medium text-muted-foreground">{watch.types[type]}</dt>
              <dd>
                <ul className="flex flex-wrap gap-3">
                  {availability.offers[type].map((service) => (
                    <li key={service.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                      {service.logoPath ? (
                        <Image
                          src={`${LOGO_BASE}${service.logoPath}`}
                          alt={watch.logo(service.name)}
                          width={28}
                          height={28}
                          unoptimized
                          className="rounded-sm"
                        />
                      ) : null}
                      <span className="text-sm text-foreground">{service.name}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      )}

      {availability.link ? (
        <a
          href={availability.link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {watch.offers}
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      ) : null}
      <p className="text-sm text-muted-foreground">{watch.attribution}</p>
    </div>
  );
}
