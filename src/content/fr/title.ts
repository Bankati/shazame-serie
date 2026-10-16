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
  sections: {
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
