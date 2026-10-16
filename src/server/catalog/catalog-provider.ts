import "server-only";

// Abstraction du catalogue (architecture.md, AD-07) : TMDB en V1, plan B possible (Q2) sans toucher au pipeline.

export type MediaType = "movie" | "tv";
export type CatalogLanguage = "fr-FR" | "en-US";

/** Résultat de recherche normalisé : un film ou une série. */
export type CatalogCandidate = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  year: number | null;
  posterPath: string | null;
  popularity: number;
};

export type CatalogTitleDetails = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  year: number | null;
  overview: string;
  genres: string[];
  runtimeMinutes: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  voteAverage: number;
};

/** Raison affichée d'une suggestion (CDC 12.6, « explication de la suggestion »). */
export type SimilarReason = { kind: "director"; name: string } | { kind: "genre"; name: string } | { kind: "related" };

export type SimilarTitle = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  reason: SimilarReason;
};

export type CastMember = { id: number; name: string; character: string | null; profilePath: string | null };

/** Tout ce qu'affiche la fiche titre (U15). */
export type TitlePage = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  originalTitle: string;
  year: number | null;
  tagline: string | null;
  overview: string;
  genres: string[];
  runtimeMinutes: number | null;
  seasons: number | null;
  voteAverage: number;
  voteCount: number;
  posterPath: string | null;
  backdropPath: string | null;
  /** Réalisation (film) ou création (série). */
  directors: string[];
  writers: string[];
  cast: CastMember[];
  /** Identifiant YouTube de la bande-annonce, ou null. */
  trailerKey: string | null;
  similar: SimilarTitle[];
};

export type CatalogImageConfig = {
  secureBaseUrl: string;
  posterSizes: string[];
  backdropSizes: string[];
};

export interface CatalogProvider {
  searchTitles(query: string, language: CatalogLanguage): Promise<CatalogCandidate[]>;
  getTitleDetails(tmdbId: number, mediaType: MediaType): Promise<CatalogTitleDetails | null>;
  getImageConfig(): Promise<CatalogImageConfig>;
  getTitlePage(tmdbId: number, mediaType: MediaType): Promise<TitlePage | null>;
}

/** Échec du catalogue (indisponible, réponse invalide) : jamais le détail technique côté utilisateur. */
export class CatalogError extends Error {
  constructor(readonly reason: "unavailable" | "invalid_response" | "not_found") {
    super(`Catalogue : ${reason}`);
    this.name = "CatalogError";
  }
}
