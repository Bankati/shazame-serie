import "server-only";

import { ACCESS_TYPES, type WatchAvailability, type WatchService } from "@/schemas/watch";

import type { MediaType } from "../catalog-provider";

// Abstraction « où regarder » (architecture.md, AD-07) : TMDB watch/providers (JustWatch) en V1,
// Watchmode possible en secours sans toucher à l'interface.

export const DEFAULT_COUNTRY = "FR";

/** Données brutes d'un pays, au format TMDB (validées par zod avant d'arriver ici). */
export type CountryOffers = {
  link: string | null;
  flatrate?: RawService[];
  free?: RawService[];
  ads?: RawService[];
  rent?: RawService[];
  buy?: RawService[];
};

export type RawService = { provider_id: number; provider_name: string; logo_path?: string | null; display_priority?: number };

export interface WatchProvider {
  /** Disponibilités de tous les pays d'un titre, ou {} s'il n'y en a aucune. */
  getOffersByCountry(tmdbId: number, mediaType: MediaType): Promise<Record<string, CountryOffers>>;
}

/** Disponibilité pour un pays : services triés par priorité d'affichage, sans doublon par type d'accès. */
export function availabilityFor(byCountry: Record<string, CountryOffers>, country: string): WatchAvailability {
  const countries = Object.keys(byCountry).filter((code) => /^[A-Z]{2}$/.test(code)).sort();
  const data = byCountry[country];
  const offers = Object.fromEntries(ACCESS_TYPES.map((type) => [type, normalize(data?.[type])])) as WatchAvailability["offers"];
  return { country, countries, link: data?.link ?? null, offers };
}

function normalize(services: RawService[] | undefined): WatchService[] {
  const seen = new Set<number>();
  return [...(services ?? [])]
    .sort((a, b) => (a.display_priority ?? 999) - (b.display_priority ?? 999))
    .filter((service) => !seen.has(service.provider_id) && seen.add(service.provider_id))
    .map((service) => ({ id: service.provider_id, name: service.provider_name, logoPath: service.logo_path ?? null }));
}

/** Pays demandé (paramètre), sinon pays de l'en-tête Vercel, sinon la France. */
export function chooseCountry(requested: string | null, header: string | null): string {
  for (const candidate of [requested, header]) {
    const code = candidate?.trim().toUpperCase();
    if (code && /^[A-Z]{2}$/.test(code)) {
      return code;
    }
  }
  return DEFAULT_COUNTRY;
}

export function hasOffers(availability: WatchAvailability): boolean {
  return ACCESS_TYPES.some((type) => availability.offers[type].length > 0);
}
