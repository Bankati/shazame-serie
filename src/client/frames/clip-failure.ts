import { CLIP_EXTENSIONS } from "@/shared/frames/constants";

import { ClipError } from "./clip-error";

/** Étape où la lecture a échoué : lecture native, chargement du secours, ou extraction par le secours. */
export type ClipFailureStage = "native" | "fallback";

/**
 * Signalement d'une vidéo illisible (U33), pour savoir quels formats et appareils échouent encore. Invariant 9 :
 * ni le nom du fichier ni son contenu, seulement l'extension reconnue, le type MIME et une taille arrondie.
 */
export type ClipFailureReport = {
  problem: string;
  stage: ClipFailureStage;
  extension: string;
  mime_type: string;
  size_mb: number;
  /** Nom de la classe d'une erreur inattendue (jamais son message) ; absent pour un refus de lecture normal. */
  unexpected?: string;
};

const SIZE_STEP_MB = 10;
const MAX_MIME_LENGTH = 40;

export function describeClipFailure(file: File, stage: ClipFailureStage, error: unknown): ClipFailureReport {
  const name = file.name.toLowerCase();
  const extension = CLIP_EXTENSIONS.find((candidate) => name.endsWith(candidate)) ?? "other";
  const mimeType = /^video\/[\w.+-]+$/.test(file.type) && file.type.length <= MAX_MIME_LENGTH ? file.type : file.type ? "other" : "none";
  const report: ClipFailureReport = {
    problem: error instanceof ClipError ? error.problem : "unreadable",
    stage,
    extension,
    mime_type: mimeType,
    // Arrondi à la dizaine de mégaoctets supérieure : assez pour repérer les gros fichiers, rien de plus.
    size_mb: Math.ceil(file.size / (1024 * 1024) / SIZE_STEP_MB) * SIZE_STEP_MB,
  };
  if (!(error instanceof ClipError)) {
    report.unexpected = error instanceof Error ? error.name.replace(/[^\w.-]/g, "").slice(0, 40) || "Error" : typeof error;
  }
  return report;
}

/** À signaler : seulement les échecs de lecture (pas un fichier trop gros ou trop court, choix de l'utilisateur). */
export function isReportableClipFailure(error: unknown): boolean {
  return !(error instanceof ClipError) || error.problem === "unreadable";
}
