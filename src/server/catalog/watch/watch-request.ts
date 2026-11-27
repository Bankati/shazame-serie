import "server-only";

import { z } from "zod";

import { type AttemptLimiter, buildLimiter } from "@/server/http/attempt-limiter";
import { clientIp } from "@/server/http/rate-limit";
import { jsonError, jsonOk } from "@/server/http/respond";
import { log } from "@/server/log";

import { availabilityFor, chooseCountry, type WatchProvider } from "./watch-provider";

// GET /api/titles/{movie|tv}/{id}/watch (U16) : disponibilités pour le pays du visiteur.
// Réponse propre à chaque visiteur (pays) : jamais mise en cache par le CDN.
const NO_STORE = { "Cache-Control": "private, no-store" };
/** Revue U28 : route publique qui interroge TMDB ; un visiteur change de pays quelques fois, pas 60 fois par minute. */
export const WATCH_REQUESTS_PER_MINUTE = 60;

let limiter: AttemptLimiter | undefined;

const paramsSchema = z.object({
  mediaType: z.enum(["movie", "tv"]),
  id: z.coerce.number().int().positive().max(999_999_999),
});

export async function handleWatchRequest(
  request: Request,
  rawParams: { mediaType: string; id: string },
  provider: () => WatchProvider,
  rateLimiter: () => AttemptLimiter = () => (limiter ??= buildLimiter("watch", WATCH_REQUESTS_PER_MINUTE, "1 m")),
): Promise<Response> {
  const rate = await rateLimiter().consume(`watch:${clientIp(request.headers)}`);
  if (!rate.ok) {
    return jsonError("RATE_LIMITED", undefined, { headers: NO_STORE });
  }
  const params = paramsSchema.safeParse(rawParams);
  if (!params.success) {
    return jsonError("VALIDATION_ERROR", undefined, { headers: NO_STORE });
  }

  const url = new URL(request.url);
  const country = chooseCountry(url.searchParams.get("country"), request.headers.get("x-vercel-ip-country"));

  try {
    const byCountry = await provider().getOffersByCountry(params.data.id, params.data.mediaType);
    return jsonOk(availabilityFor(byCountry, country), { headers: NO_STORE });
  } catch {
    log.warn("watch.unavailable", { media_type: params.data.mediaType });
    return jsonError("UPSTREAM_ERROR", undefined, { headers: NO_STORE });
  }
}
