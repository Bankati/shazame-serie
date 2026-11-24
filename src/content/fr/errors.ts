import type { ErrorCode } from "@/schemas/errors";

// Messages par défaut renvoyés avec chaque code d'erreur API (en français, sans détail technique).
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "La requête est invalide.",
  UNAUTHENTICATED: "Accès refusé.",
  FORBIDDEN: "Vous n'avez pas accès à cette ressource.",
  ACCOUNT_SUSPENDED: "Votre compte est suspendu.",
  NOT_FOUND: "Ressource introuvable.",
  QUOTA_EXCEEDED: "Vous avez atteint votre limite d'identifications pour aujourd'hui.",
  RATE_LIMITED: "Trop de requêtes. Réessayez dans quelques instants.",
  WATCHLIST_FULL: "Votre liste de suivi est pleine.",
  FRAMES_UNUSABLE: "Nous n'avons pas pu extraire assez d'images exploitables de cet extrait.",
  LINK_UNSUPPORTED: "Ce lien n'est pas pris en charge.",
  LINK_NOT_FOUND: "Cette publication est introuvable ou n'est pas publique.",
  LINK_NO_CLUES: "Cette publication ne donne pas assez d'indices pour être identifiée.",
  AI_PAUSED: "L'identification est momentanément indisponible. Réessayez plus tard.",
  UPSTREAM_ERROR: "Un service externe ne répond pas. Réessayez dans quelques instants.",
  INTERNAL_ERROR: "Une erreur inattendue s'est produite.",
};
