import "server-only";

import { z } from "zod";

import type { CatalogSearchResult } from "@/schemas/report";
import { type AttemptLimiter, buildLimiter } from "@/server/http/attempt-limiter";
import { clientIp } from "@/server/http/rate-limit";
import { jsonError, jsonOk } from "@/server/http/respond";
import { log } from "@/server/log";

import type { CatalogProvider } from "./catalog-provider";
import { getCatalog } from "./tmdb/tmdb-catalog";

// GET /api/catalog/search?q=… (U20) : recherche du bon titre dans la fenêtre de signalement. Ouverte aux
// visiteurs, limitée par adresse IP (chaque recherche peut appeler TMDB).
export const SEARCHES_PER_MINUTE = 30;
const MAX_RESULTS = 8;
const querySchema = z.object({ q: z.string().trim().min(2).max(100) });

let limiter: AttemptLimiter | undefined;

export async function handleCatalogSearch(
  request: Request,
  deps: { limiter?: AttemptLimiter; catalog?: () => CatalogProvider } = {},
): Promise<Response> {
  limiter ??= buildLimiter("catalog-search", SEARCHES_PER_MINUTE, "1 m");
  const rate = await (deps.limiter ?? limiter).consume(`search:${clientIp(request.headers)}`);
  if (!rate.ok) {
    return jsonError("RATE_LIMITED");
  }
  const input = querySchema.safeParse({ q: new URL(request.url).searchParams.get("q") ?? "" });
  if (!input.success) {
    return jsonError("VALIDATION_ERROR");
  }
  try {
    const candidates = await (deps.catalog ?? getCatalog)().searchTitles(input.data.q, "fr-FR");
    const results: CatalogSearchResult[] = candidates
      .slice(0, MAX_RESULTS)
      .map(({ tmdbId, mediaType, title, year, posterPath }) => ({ tmdbId, mediaType, title, year, posterPath }));
    // Résultats publics de TMDB : mis en cache côté navigateur une minute.
    return jsonOk({ results }, { headers: { "Cache-Control": "private, max-age=60" } });
  } catch {
    log.warn("catalog.search_unavailable");
    return jsonError("UPSTREAM_ERROR");
  }
}
