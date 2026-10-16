import "server-only";

import { z } from "zod";

import { cachedJson } from "@/server/cache/redis";
import { env } from "@/server/env";

import { CatalogError, type MediaType } from "../catalog-provider";
import { createTmdbClient, type TmdbGet } from "../tmdb/client";
import type { CountryOffers, WatchProvider } from "./watch-provider";

// TMDB watch/providers (données JustWatch, D3). Disponibilités en cache 12 h : elles changent plus souvent
// que les fiches, et restent bien sous la limite de 6 mois des conditions TMDB.
const CACHE_TTL_S = 12 * 60 * 60;

const serviceSchema = z.object({
  provider_id: z.number().int(),
  provider_name: z.string(),
  logo_path: z.string().nullable().optional(),
  display_priority: z.number().optional(),
});

const countrySchema = z.object({
  link: z.url({ protocol: /^https$/ }).nullable().catch(null),
  flatrate: z.array(serviceSchema).optional(),
  free: z.array(serviceSchema).optional(),
  ads: z.array(serviceSchema).optional(),
  rent: z.array(serviceSchema).optional(),
  buy: z.array(serviceSchema).optional(),
});

const responseSchema = z.object({ results: z.record(z.string(), z.unknown()).catch({}) });
const byCountrySchema = z.record(z.string(), countrySchema);

export class TmdbWatchProviders implements WatchProvider {
  constructor(private readonly get: TmdbGet) {}

  getOffersByCountry(tmdbId: number, mediaType: MediaType): Promise<Record<string, CountryOffers>> {
    return cachedJson(`tmdb:watch:${mediaType}:${tmdbId}`, CACHE_TTL_S, byCountrySchema, async () => {
      try {
        const { results } = await this.get({ path: `/${mediaType}/${tmdbId}/watch/providers` }, responseSchema);
        // Chaque pays est validé à part : un pays mal formé est ignoré sans perdre les autres.
        return Object.fromEntries(
          Object.entries(results).flatMap(([country, value]) => {
            const parsed = countrySchema.safeParse(value);
            return parsed.success ? [[country, parsed.data]] : [];
          }),
        );
      } catch (error) {
        if (error instanceof CatalogError && error.reason === "not_found") {
          return {};
        }
        throw error;
      }
    });
  }
}

let provider: TmdbWatchProviders | undefined;

export function getWatchProvider(): TmdbWatchProviders {
  if (!env.TMDB_API_TOKEN) {
    throw new CatalogError("unavailable");
  }
  provider ??= new TmdbWatchProviders(createTmdbClient({ token: env.TMDB_API_TOKEN }));
  return provider;
}
