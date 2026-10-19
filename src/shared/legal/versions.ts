// Versions des textes acceptés à l'inscription (consents.version). Textes provisoires jusqu'à U27 :
// la version définitive demandera un nouveau consentement (context/plans/U04.md, décision 5).
export const LEGAL_VERSIONS = {
  terms: "draft-2026-10",
  privacy: "draft-2026-10",
} as const;

/** Âge minimum d'inscription (Q19 : proposé à 15 ans, à valider par un juriste). */
export const MINIMUM_AGE = 15;
