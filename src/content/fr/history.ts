// Textes de l'historique (U17). Vouvoiement.
export const HISTORY_TEXT = {
  metaTitle: "Historique",
  title: "Historique",
  description: "Vos 50 dernières identifications réussies. Elles sont conservées 2 ans.",
  kind: { movie: "Film", tv: "Série" },
  unavailable: "Titre indisponible",
  identifiedOn: (date: string) => `Identifié le ${date}`,
  empty: {
    title: "Aucune identification pour le moment",
    description: "Les titres que vous identifiez apparaîtront ici, avec leur date et leur niveau de confiance.",
    cta: "Identifier un extrait",
  },
} as const;
