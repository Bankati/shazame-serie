import { CLIP_EXTENSIONS, CLIP_MAX_BYTES, CLIP_MIME_TYPES, CLIP_MIN_DURATION_S } from "@/shared/frames/constants";

/** Motifs de refus d'un clip ; les messages sont dans src/content/fr/identify.ts. */
export type ClipProblem = "unsupported_format" | "empty" | "too_large" | "too_short" | "unreadable";

export type ClipCheck = { ok: true } | { ok: false; problem: ClipProblem };

/** Contrôle immédiat, avant tout décodage : type et taille. */
export function checkClipFile(file: { name: string; type: string; size: number }): ClipCheck {
  if (!isSupportedType(file)) {
    return { ok: false, problem: "unsupported_format" };
  }
  if (file.size === 0) {
    return { ok: false, problem: "empty" };
  }
  if (file.size > CLIP_MAX_BYTES) {
    return { ok: false, problem: "too_large" };
  }
  return { ok: true };
}

/** Contrôle de la durée lue dans les métadonnées de la vidéo (pas de maximum : un passage de 60 s est analysé). */
export function checkClipDuration(durationS: number): ClipCheck {
  if (!Number.isFinite(durationS) || durationS <= 0) {
    return { ok: false, problem: "unreadable" };
  }
  if (durationS < CLIP_MIN_DURATION_S) {
    return { ok: false, problem: "too_short" };
  }
  return { ok: true };
}

/**
 * Valeur de l'attribut `accept` du champ fichier : `video/*` pour que les galeries des téléphones proposent
 * toutes les vidéos (certaines masquent un MKV ou un 3GP sinon) ; le contrôle ci-dessus trie ensuite.
 */
export const CLIP_ACCEPT = ["video/*", ...CLIP_EXTENSIONS].join(",");

function isSupportedType(file: { name: string; type: string }): boolean {
  if ((CLIP_MIME_TYPES as readonly string[]).includes(file.type)) {
    return true;
  }
  // Type absent, générique ou propre au système (MKV, AVI sous Windows) : on se fie à l'extension.
  if (file.type === "" || file.type === "application/octet-stream" || file.type.startsWith("video/")) {
    const name = file.name.toLowerCase();
    return CLIP_EXTENSIONS.some((extension) => name.endsWith(extension));
  }
  return false;
}
