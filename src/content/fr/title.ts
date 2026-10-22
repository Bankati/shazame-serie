import type { SimilarReason } from "@/server/catalog/catalog-provider";

// Textes de la fiche titre (U15). Vouvoiement, espaces insécables avant ? ! : ; et %.
export const TITLE_TEXT = {
  kind: { movie: "Film", tv: "Série" },
  runtime: (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours} h${rest > 0 ? ` ${String(rest).padStart(2, "0")} min` : ""}` : `${minutes} min`;
  },
  episodeRuntime: (minutes: number) => `${minutes} min par épisode`,
  seasons: (count: number) => `${count} saison${count > 1 ? "s" : ""}`,
  rating: (average: number, votes: number) =>
    `Note TMDB : ${average.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / 10 (${votes.toLocaleString("fr-FR")} votes)`,
  credits: {
    movie: "Réalisation",
    tv: "Création",
    writers: "Scénario",
  },
  watch: {
    country: "Pays",
    types: {
      flatrate: "Abonnement",
      free: "Gratuit",
      ads: "Gratuit avec publicité",
      rent: "Location",
      buy: "Achat",
    },
    offers: "Voir les offres et les liens",
    none: (country: string) => `Aucun service de streaming ne propose ce titre dans ce pays (${country}) pour le moment.`,
    tryAnother: "Choisissez un autre pays pour voir où le regarder.",
    unavailable: "Les disponibilités ne peuvent pas être affichées pour le moment. Réessayez plus tard.",
    attribution: "Disponibilités fournies par JustWatch.",
    logo: (name: string) => `Logo de ${name}`,
  },
  // Carte « Détails » de la colonne latérale (U40).
  details: {
    title: "Détails",
    type: "Type",
    originalTitle: "Titre original",
    directors: { movie: "Réalisation", tv: "Création" },
    writers: "Scénario",
    rating: "Note TMDB",
    ratingValue: (average: number, votes: number) =>
      `${average.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / 10 (${votes.toLocaleString("fr-FR")} votes)`,
  },
  genresLabel: "Genres",
  sections: {
    watch: "Où regarder",
    trailer: "Bande-annonce",
    synopsis: "Synopsis",
    cast: "Distribution",
    similar: "Titres similaires",
    sources: "Sources",
  },
  noOverview: "Aucun synopsis n'est encore disponible pour ce titre.",
  trailer: {
    play: (title: string) => `Lire la bande-annonce de ${title}`,
    hint: "La vidéo est chargée depuis YouTube (youtube-nocookie.com) au clic.",
    frameTitle: (title: string) => `Bande-annonce de ${title}`,
  },
  castPhoto: (name: string) => `Photo de ${name}`,
  character: (name: string) => `${name}`,
  reason: (reason: SimilarReason) => {
    switch (reason.kind) {
      case "director":
        return `Même réalisation : ${reason.name}`;
      case "genre":
        return `Même genre : ${reason.name}`;
      default:
        return "Souvent associé";
    }
  },
  sources: {
    data: "Informations, affiches et photos fournies par TMDB (The Movie Database).",
    logo: "Logo de TMDB",
  },
  metadata: {
    title: (title: string, year: number | null) => (year ? `${title} (${year})` : title),
    description: (overview: string, title: string) =>
      overview ? (overview.length > 160 ? `${overview.slice(0, 157).trimEnd()}…` : overview) : `Fiche de ${title}.`,
  },
} as const;
