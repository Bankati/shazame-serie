// Textes des rangées et de la vedette de l'accueil (refonte sombre, 16 octobre 2026).
export const SHOWCASE_TEXT = {
  featured: {
    eyebrow: "À l'affiche cette semaine",
    kind: { movie: "Film", tv: "Série" },
    viewTitle: "Voir la fiche",
    previous: "Titre précédent",
    next: "Titre suivant",
    goTo: (index: number, total: number, title: string) => `Titre ${index} sur ${total} : ${title}`,
    region: "Titres à l'affiche",
    pause: "Mettre en pause le défilement",
    play: "Reprendre le défilement",
  },
  rows: {
    trendingMovies: "Films en tendance",
    trendingShows: "Séries en tendance",
    topRated: "Les films les mieux notés",
    previous: (row: string) => `${row} : défiler vers la gauche`,
    next: (row: string) => `${row} : défiler vers la droite`,
  },
  genres: {
    title: "Explorer par genre",
    subtitle: "Choisissez un genre : les films du moment s'affichent.",
    count: (count: number) => `${count} film${count > 1 ? "s" : ""}`,
    results: (genre: string) => `Films : ${genre}`,
  },
  rating: (score: string) => `Note : ${score} sur 5`,
  posterAlt: (title: string, year: number | null) => (year ? `Affiche de ${title} (${year})` : `Affiche de ${title}`),
  source: "Titres, affiches et notes fournis par TMDB.",
} as const;
