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

export type CatalogImageConfig = {
  secureBaseUrl: string;
  posterSizes: string[];
  backdropSizes: string[];
};

export interface CatalogProvider {
  searchTitles(query: string, language: CatalogLanguage): Promise<CatalogCandidate[]>;
  getTitleDetails(tmdbId: number, mediaType: MediaType): Promise<CatalogTitleDetails | null>;
  getImageConfig(): Promise<CatalogImageConfig>;
}

/** Échec du catalogue (indisponible, réponse invalide) : jamais le détail technique côté utilisateur. */
export class CatalogError extends Error {
  constructor(readonly reason: "unavailable" | "invalid_response" | "not_found") {
    super(`Catalogue : ${reason}`);
    this.name = "CatalogError";
  }
}
