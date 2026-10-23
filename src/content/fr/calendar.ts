// Textes du calendrier des sorties (U42, AD-47). Vouvoiement.
export const CALENDAR_TEXT = {
  metaTitle: "Calendrier des sorties",
  title: "Calendrier des sorties",
  highlight: "sorties",
  description: "Les films qui arrivent en salle en France et les séries en cours de diffusion.",
  tabsLabel: "Type de sortie",
  tabs: { films: "Films à venir", series: "Séries en diffusion" },
  kind: { movie: "Film", tv: "Série" },
  date: {
    movie: (date: string) => `Sortie le ${date}`,
    tv: (date: string) => `Première diffusion le ${date}`,
    unknown: "Date à confirmer",
  },
  undated: "Date à confirmer",
  posterAlt: (title: string) => `Affiche de ${title}`,
  details: "Voir la fiche",
  detailsLabel: (title: string) => `Voir la fiche de ${title}`,
  source: "Dates et informations fournies par TMDB, pour la France.",
  empty: {
    title: "Aucune sortie à afficher",
    description: "TMDB ne propose rien pour le moment. Revenez dans quelques jours !",
    cta: "Identifier un extrait",
  },
  unavailable: {
    title: "Calendrier momentanément indisponible",
    description: "Le catalogue ne répond pas. Réessayez dans quelques minutes.",
    cta: "Identifier un extrait",
  },
} as const;
