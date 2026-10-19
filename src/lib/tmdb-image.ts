// Adresses des images TMDB (https://developer.themoviedb.org/docs/image-basics). La base et les tailles
// sont celles de `configuration` (U08) ; elles sont stables, donc fixées ici pour le rendu côté navigateur.

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/";

export type PosterSize = "w92" | "w185" | "w342" | "w500";

/** Adresse de l'affiche dans la taille demandée, ou null si TMDB n'en a pas. */
export function posterUrl(posterPath: string | null, size: PosterSize): string | null {
  return posterPath && posterPath.startsWith("/") ? `${TMDB_IMAGE_BASE}${size}${posterPath}` : null;
}
