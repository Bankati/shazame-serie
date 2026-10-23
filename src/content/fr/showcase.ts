// Textes des rangées d'affiches et des genres de l'accueil (16 octobre 2026 ; vedette retirée en U43).
export const SHOWCASE_TEXT = {
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
