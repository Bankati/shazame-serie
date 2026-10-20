import { ClipError } from "./clip-error";
import type { FrameSource } from "./frame-source";

/** Issue d'une tentative de lecture : réussie (images vides ou non) ou en échec. */
export type ReadAttempt = { ok: true; blank: boolean } | { ok: false; error: unknown };

/**
 * Passer à la lecture de secours (AD-40, AD-41) ? Oui seulement après une lecture native qui n'a pas su décoder
 * la vidéo : échec de lecture (ouverture, déplacement, dimensions nulles) ou images toutes vides. Jamais après
 * une annulation, ni pour un refus qui ne tient pas au décodage (clip trop court).
 */
export function shouldUseFallback(kind: FrameSource["kind"], attempt: ReadAttempt, aborted: boolean): boolean {
  if (kind !== "native" || aborted) {
    return false;
  }
  return attempt.ok ? attempt.blank : attempt.error instanceof ClipError && attempt.error.problem === "unreadable";
}
