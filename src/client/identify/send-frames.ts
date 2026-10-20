import { z } from "zod";

import { errorCodeSchema } from "@/schemas/errors";
import {
  type FrameMode,
  type IdentifyResponse,
  identifyResponseSchema,
  quotaInfoSchema,
  type QuotaInfo,
} from "@/schemas/identify";

// Envoi du paquet d'images (jamais la vidéo, invariant 1) ou d'une description (U35), et lecture validée de
// la réponse, commune aux deux.

export type IdentifyFailure =
  | { kind: "quota"; quota: QuotaInfo | null }
  | { kind: "rate_limited" }
  | { kind: "frames" }
  /** Description refusée (longueur) : U35. */
  | { kind: "text" }
  | { kind: "paused" }
  | { kind: "suspended" }
  | { kind: "unavailable" };

export type IdentifyCall = { ok: true; response: IdentifyResponse } | { ok: false; failure: IdentifyFailure };

const successSchema = z.object({ ok: z.literal(true), data: identifyResponseSchema });
const errorSchema = z.object({
  ok: z.literal(false),
  error: z.object({ code: errorCodeSchema, details: z.object({ quota: quotaInfoSchema }).optional() }),
});

export async function sendFrames(frames: readonly Blob[], mode: FrameMode, signal?: AbortSignal): Promise<IdentifyCall> {
  const body = new FormData();
  // Mode (U34) : images d'un clip, ou captures envoyées telles quelles (consigne IA propre, 1 image possible).
  body.set("mode", mode);
  frames.forEach((frame, index) => body.append("frames", frame, `image-${index + 1}.jpg`));
  return postIdentify("/api/identify", { method: "POST", body, signal }, "frames");
}

/** Description écrite (U35) : envoyée en JSON ; un refus de validation vise le texte, pas des images. */
export function sendDescription(text: string, signal?: AbortSignal): Promise<IdentifyCall> {
  return postIdentify(
    "/api/identify/description",
    { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }), signal },
    "text",
  );
}

async function postIdentify(url: string, init: RequestInit, invalidKind: "frames" | "text"): Promise<IdentifyCall> {
  const signal = init.signal;
  let payload: unknown;
  try {
    const response = await fetch(url, init);
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
    case "ACCOUNT_SUSPENDED":
      return { ok: false, failure: { kind: "suspended" } };
    case "FRAMES_UNUSABLE":
    case "VALIDATION_ERROR":
      return { ok: false, failure: { kind: invalidKind } };
    default:
      return { ok: false, failure: { kind: "unavailable" } };
  }
}
