import { WATCHLIST_FREE_LIMIT } from "@/shared/watchlist";

// Textes de la liste de suivi (U18). Vouvoiement.
export const WATCHLIST_TEXT = {
  add: "Ajouter à ma liste",
  added: "Dans ma liste",
  signIn: "Connectez-vous pour garder ce titre dans votre liste.",
  failures: {
    full: `Votre liste est pleine (${WATCHLIST_FREE_LIMIT} titres en accès gratuit). Retirez un titre ou passez à Premium pour une liste illimitée.`,
    suspended: "Votre compte est suspendu : la liste ne peut pas être modifiée.",
    visitor: "Connectez-vous pour garder ce titre dans votre liste.",
    unavailable: "La liste n'a pas pu être mise à jour. Réessayez dans un instant.",
  },
  page: {
    metaTitle: "Ma liste",
    title: "Ma liste",
    description: "Les films et séries que vous voulez regarder.",
    count: (count: number, limit: number | null) =>
      limit === null ? `${count} titre${count > 1 ? "s" : ""}` : `${count} / ${limit} titres`,
    unavailable: "Titre indisponible",
    posterAlt: (title: string) => `Affiche de ${title}`,
    remove: "Retirer",
    empty: {
      title: "Votre liste est vide",
      description: "Ajoutez un titre depuis un résultat d'identification ou une fiche : il apparaîtra ici.",
      cta: "Identifier un extrait",
    },
  },
} as const;
