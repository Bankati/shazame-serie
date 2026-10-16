import { describe, expect, it } from "vitest";

import { matchProposedTitle } from "@/server/catalog/match-title";
import type { ProposedTitle } from "@/server/catalog/matching";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";

// Critère de fin de U08 : 20 titres connus, tels qu'une IA pourrait les proposer (titre français ou original,
// année parfois absente ou décalée d'un an), retrouvés en direct sur TMDB.
const TITLES: [ProposedTitle, number, "movie" | "tv"][] = [
  [{ title: "Matrix", year: 1999, kind: "film" }, 603, "movie"],
  [{ title: "The Matrix", kind: "film" }, 603, "movie"],
  [{ title: "Intouchables", year: 2011, kind: "film" }, 77338, "movie"],
  [{ title: "Le Fabuleux Destin d'Amélie Poulain", year: 2001, kind: "film" }, 194, "movie"],
  [{ title: "La Casa de Papel", year: 2017, kind: "serie" }, 71446, "tv"],
  [{ title: "Money Heist", originalTitle: "La casa de papel", kind: "serie" }, 71446, "tv"],
  [{ title: "Breaking Bad", year: 2008, kind: "serie" }, 1396, "tv"],
  [{ title: "Le Seigneur des anneaux : La Communauté de l'anneau", year: 2001, kind: "film" }, 120, "movie"],
  [{ title: "The Lord of the Rings: The Fellowship of the Ring", year: 2002, kind: "film" }, 120, "movie"],
  [{ title: "Le Voyage de Chihiro", year: 2001, kind: "anime" }, 129, "movie"],
  [{ title: "Spirited Away", originalTitle: "千と千尋の神隠し", kind: "anime" }, 129, "movie"],
  [{ title: "L'Attaque des Titans", year: 2013, kind: "anime" }, 1429, "tv"],
  [{ title: "Attack on Titan", kind: "anime" }, 1429, "tv"],
  [{ title: "Les Évadés", originalTitle: "The Shawshank Redemption", year: 1994, kind: "film" }, 278, "movie"],
  [{ title: "Inception", year: 2010, kind: "film" }, 27205, "movie"],
  [{ title: "Lupin", year: 2021, kind: "serie" }, 96677, "tv"],
  [{ title: "Dune", year: 2021, kind: "film" }, 438631, "movie"],
  [{ title: "Dune", year: 1984, kind: "film" }, 841, "movie"],
  [{ title: "The Office", year: 2005, kind: "serie" }, 2316, "tv"],
  [{ title: "Squid Game", year: 2021, kind: "serie" }, 93405, "tv"],
];

describe("rapprochement TMDB en direct (20 titres)", () => {
  it.each(TITLES)("%o → %s (%s)", async (proposed, tmdbId, mediaType) => {
    const result = await matchProposedTitle(getCatalog(), proposed);
    expect(result.status).toBe("matched");
    if (result.status === "matched") {
      expect({ tmdbId: result.best.tmdbId, mediaType: result.best.mediaType }).toEqual({ tmdbId, mediaType });
    }
  });

  it("ne trouve rien pour un titre inventé", async () => {
    const result = await matchProposedTitle(getCatalog(), { title: "Zxqwv Plorbnik", year: 2019, kind: "film" });
    expect(result.status).toBe("none");
  });
});
