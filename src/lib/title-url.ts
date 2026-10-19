// Adresses des fiches (AD-09) : /titre/{film|serie}/{tmdbId}-{slug}. Partagé entre le serveur (redirection
// vers l'adresse canonique) et le navigateur (lien « Voir la fiche »).

export type MediaType = "movie" | "tv";

const KIND_BY_MEDIA: Record<MediaType, string> = { movie: "film", tv: "serie" };
const MEDIA_BY_KIND: Record<string, MediaType> = { film: "movie", serie: "tv" };
const MAX_SLUG_LENGTH = 80;

/** « Le Fabuleux Destin d'Amélie Poulain » → « le-fabuleux-destin-d-amelie-poulain ». */
export function slugify(title: string): string {
  const slug = title
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
  // Titre sans aucune lettre latine (ex. titre japonais seul) : l'identifiant suffit à retrouver la fiche.
  return slug || "titre";
}

export function titlePath(mediaType: MediaType, tmdbId: number, title: string): string {
  return `/titre/${KIND_BY_MEDIA[mediaType]}/${tmdbId}-${slugify(title)}`;
}

export type ParsedTitlePath = { mediaType: MediaType; tmdbId: number; slug: string | null };

/** Lit les deux segments de l'adresse ; null si l'adresse ne peut désigner aucune fiche. */
export function parseTitlePath(kind: string, idSlug: string): ParsedTitlePath | null {
  const mediaType = MEDIA_BY_KIND[kind];
  const match = /^(\d{1,9})(?:-(.*))?$/.exec(idSlug);
  if (!mediaType || !match) {
    return null;
  }
  const tmdbId = Number(match[1]);
  return tmdbId > 0 ? { mediaType, tmdbId, slug: match[2] ?? null } : null;
}
