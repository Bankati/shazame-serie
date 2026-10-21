// Textes de la page d'identification de l'application (U38, AD-46).
export const APP_HOME_TEXT = {
  metaTitle: "Identifier un film ou une série",
  title: "Quel est ce film ?",
  highlight: "film",
  subtitle: "Envoyez une vidéo ou des captures, décrivez la scène, ou collez le lien de la publication.",
  recent: {
    title: "Vos identifications récentes",
    all: "Tout l'historique",
    confidence: (percent: number) => `${percent} %`,
    signedOut: "Connectez-vous pour retrouver ici vos dernières identifications.",
    signIn: "Se connecter",
  },
} as const;
