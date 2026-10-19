import { APP_TEXT } from "./app";

// Textes du partage (U19). Vouvoiement.
export const SHARE_TEXT = {
  button: "Partager",
  copied: "Lien copié : collez-le où vous voulez le partager.",
  failed: "Le lien n'a pas pu être copié. Copiez l'adresse de la page dans votre navigateur.",
  message: (title: string) => `${title} : trouvé avec ${APP_TEXT.name}`,
  card: {
    kind: { movie: "Film", tv: "Série" },
    footer: `Identifié avec ${APP_TEXT.name}`,
    source: "Données TMDB",
    fallbackTitle: "Quel est ce film ?",
    fallbackSubtitle: APP_TEXT.tagline,
    alt: (title: string) => `${title} sur ${APP_TEXT.name}`,
  },
} as const;
