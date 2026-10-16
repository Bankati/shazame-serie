import type { ErrorCode } from "@/schemas/errors";

// Messages par défaut renvoyés avec chaque code d'erreur API (en français, sans détail technique).
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "La requête est invalide.",
  UNAUTHENTICATED: "Accès refusé.",
  FORBIDDEN: "Vous n'avez pas accès à cette ressource.",
  NOT_FOUND: "Ressource introuvable.",
  QUOTA_EXCEEDED: "Vous avez atteint votre limite d'identifications pour aujourd'hui.",
  RATE_LIMITED: "Trop de requêtes. Réessayez dans quelques instants.",
  WATCHLIST_FULL: "Votre liste de suivi est pleine.",
  FRAMES_UNUSABLE: "Nous n'avons pas pu extraire assez d'images exploitables de cet extrait.",
  AI_PAUSED: "L'identification est momentanément indisponible. Réessayez plus tard.",
  UPSTREAM_ERROR: "Un service externe ne répond pas. Réessayez dans quelques instants.",
  INTERNAL_ERROR: "Une erreur inattendue s'est produite.",
};
