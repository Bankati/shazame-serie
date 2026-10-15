import "server-only";

import type { z } from "zod";

import { log } from "@/server/log";

import { CatalogError } from "../catalog-provider";

// Appels HTTP à TMDB v3 : délai maximal, une nouvelle tentative sur 429 / 5xx / panne réseau,
// réponse validée par zod. Le jeton n'apparaît jamais dans les journaux (invariant 9).

export const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TIMEOUT_MS = 5_000;
const MAX_ATTEMPTS = 2;
const DEFAULT_RETRY_DELAY_MS = 500;
const MAX_RETRY_DELAY_MS = 2_000;

export type TmdbRequest = {
  path: string;
  params?: Record<string, string | number | boolean>;
};

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export type TmdbClientOptions = {
  token: string;
  fetch?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
};

export function createTmdbClient({ token, fetch: fetchImpl = fetch, sleep = defaultSleep }: TmdbClientOptions) {
  return async function tmdbGet<T>(request: TmdbRequest, schema: z.ZodType<T>): Promise<T> {
    const url = new URL(`${TMDB_BASE_URL}${request.path}`);
    for (const [key, value] of Object.entries(request.params ?? {})) {
      url.searchParams.set(key, String(value));
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response: Response;
      try {
        response = await fetchImpl(url.toString(), {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
          signal: AbortSignal.timeout(TMDB_TIMEOUT_MS),
        });
      } catch {
        if (attempt < MAX_ATTEMPTS) {
          await sleep(DEFAULT_RETRY_DELAY_MS);
          continue;
        }
        log.warn("tmdb.unreachable", { path: request.path });
        throw new CatalogError("unavailable");
      }

      if (response.status === 404) {
        throw new CatalogError("not_found");
      }
      if (response.status === 429 || response.status >= 500) {
        if (attempt < MAX_ATTEMPTS) {
          await sleep(retryDelay(response.headers.get("retry-after")));
          continue;
        }
        log.warn("tmdb.unavailable", { path: request.path, status: response.status });
        throw new CatalogError("unavailable");
      }
      if (!response.ok) {
        log.warn("tmdb.rejected", { path: request.path, status: response.status });
        throw new CatalogError("unavailable");
      }

      const parsed = schema.safeParse(await response.json().catch(() => null));
      if (!parsed.success) {
        log.warn("tmdb.invalid_response", { path: request.path });
        throw new CatalogError("invalid_response");
      }
      return parsed.data;
    }
    throw new CatalogError("unavailable");
  };
}

export type TmdbGet = ReturnType<typeof createTmdbClient>;

/** `Retry-After` en secondes, borné pour ne pas bloquer une identification. */
function retryDelay(header: string | null): number {
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds * 1000, MAX_RETRY_DELAY_MS) : DEFAULT_RETRY_DELAY_MS;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
