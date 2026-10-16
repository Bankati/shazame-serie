import "server-only";

import type { MediaType, SimilarTitle } from "./catalog-provider";

// Titres similaires expliqués (CDC 12.6, 15.4) : d'abord les autres films du même réalisateur, puis les
// recommandations TMDB, avec le premier genre en commun comme motif, sinon « souvent associé ». Fonction pure.

export const MIN_SIMILAR = 5;
export const MAX_SIMILAR = 10;
export const MAX_SAME_DIRECTOR = 3;

export type SimilarCandidate = {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  genreIds: number[];
  popularity: number;
};

export type SimilarInput = {
  self: { tmdbId: number; mediaType: MediaType; genres: { id: number; name: string }[] };
  director: { name: string; works: SimilarCandidate[] } | null;
  recommendations: SimilarCandidate[];
};

export function buildSimilar({ self, director, recommendations }: SimilarInput): SimilarTitle[] {
  const seen = new Set([`${self.mediaType}:${self.tmdbId}`]);
  const result: SimilarTitle[] = [];
  const add = (candidate: SimilarCandidate, reason: SimilarTitle["reason"]) => {
    const key = `${candidate.mediaType}:${candidate.tmdbId}`;
    if (seen.has(key) || result.length >= MAX_SIMILAR) {
      return;
    }
    seen.add(key);
    result.push({
      tmdbId: candidate.tmdbId,
      mediaType: candidate.mediaType,
      title: candidate.title,
      year: candidate.year,
      posterPath: candidate.posterPath,
      reason,
    });
  };

  if (director) {
    const works = [...director.works].sort((a, b) => b.popularity - a.popularity);
    let added = 0;
    for (const work of works) {
      if (added >= MAX_SAME_DIRECTOR) {
        break;
      }
      const before = result.length;
      add(work, { kind: "director", name: director.name });
      added += result.length - before;
    }
  }

  const genreNames = new Map(self.genres.map((genre) => [genre.id, genre.name]));
  for (const candidate of recommendations) {
    const shared = candidate.genreIds.find((id) => genreNames.has(id));
    add(candidate, shared !== undefined ? { kind: "genre", name: genreNames.get(shared)! } : { kind: "related" });
  }
  return result;
}
