// Textes du signalement d'erreur (U20, RG8). Vouvoiement.
export const REPORT_TEXT = {
  link: "Ce n'est pas le bon titre ?",
  title: "Signaler une erreur",
  description: "Votre signalement nous aide à mieux reconnaître ce film ou cette série.",
  search: {
    label: "Quel est le bon titre ? (facultatif)",
    placeholder: "Titre du film ou de la série",
    loading: "Recherche…",
    none: "Aucun titre trouvé. Vous pouvez envoyer le signalement sans titre.",
    unavailable: "La recherche est momentanément indisponible. Vous pouvez envoyer le signalement sans titre.",
    unknown: "Je ne connais pas le bon titre",
    kind: { movie: "Film", tv: "Série" },
    selected: (title: string) => `Bon titre choisi : ${title}`,
  },
  consent: {
    label:
      "J'accepte que les images extraites de ce clip soient conservées pour améliorer la reconnaissance. Elles ne sont vues que par l'équipe et ne sont jamais publiées.",
    hint: "Sans votre accord, seules la proposition et votre correction sont enregistrées : aucune image.",
  },
  submit: "Envoyer le signalement",
  pending: "Envoi…",
  cancel: "Retour au résultat",
  thanks: "Merci ! Votre signalement a bien été envoyé.",
  failures: {
    rate_limited: "Vous avez envoyé beaucoup de signalements. Réessayez dans une heure.",
    not_found: "Ce résultat ne peut plus être signalé. Identifiez à nouveau l'extrait.",
    unavailable: "Le signalement n'a pas pu être envoyé. Réessayez dans un instant.",
  },
} as const;
