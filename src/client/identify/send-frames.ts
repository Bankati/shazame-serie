import { z } from "zod";

import { errorCodeSchema } from "@/schemas/errors";
import { type IdentifyResponse, identifyResponseSchema, quotaInfoSchema, type QuotaInfo } from "@/schemas/identify";

// Envoi du paquet d'images (jamais la vidéo, invariant 1) et lecture validée de la réponse.

export type IdentifyFailure =
  | { kind: "quota"; quota: QuotaInfo | null }
  | { kind: "rate_limited" }
  | { kind: "frames" }
  | { kind: "paused" }
  | { kind: "unavailable" };

export type IdentifyCall = { ok: true; response: IdentifyResponse } | { ok: false; failure: IdentifyFailure };

const successSchema = z.object({ ok: z.literal(true), data: identifyResponseSchema });
const errorSchema = z.object({
  ok: z.literal(false),
  error: z.object({ code: errorCodeSchema, details: z.object({ quota: quotaInfoSchema }).optional() }),
});

export async function sendFrames(frames: readonly Blob[], signal?: AbortSignal): Promise<IdentifyCall> {
  const body = new FormData();
  frames.forEach((frame, index) => body.append("frames", frame, `image-${index + 1}.jpg`));

  let payload: unknown;
  try {
    const response = await fetch("/api/identify", { method: "POST", body, signal });
    payload = await response.json();
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return { ok: false, failure: { kind: "unavailable" } };
  }

  const success = successSchema.safeParse(payload);
  if (success.success) {
    return { ok: true, response: success.data.data };
  }
  const failure = errorSchema.safeParse(payload);
  if (!failure.success) {
    return { ok: false, failure: { kind: "unavailable" } };
  }
  switch (failure.data.error.code) {
    case "QUOTA_EXCEEDED":
      return { ok: false, failure: { kind: "quota", quota: failure.data.error.details?.quota ?? null } };
    case "RATE_LIMITED":
      return { ok: false, failure: { kind: "rate_limited" } };
    case "AI_PAUSED":
      return { ok: false, failure: { kind: "paused" } };
    case "FRAMES_UNUSABLE":
    case "VALIDATION_ERROR":
      return { ok: false, failure: { kind: "frames" } };
    default:
      return { ok: false, failure: { kind: "unavailable" } };
  }
}
