import { describe, expect, it } from "vitest";

import { backdropUrl, posterUrl } from "./tmdb-image";

describe("posterUrl", () => {
  it("construit l'adresse TMDB dans la taille demandée", () => {
    expect(posterUrl("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });

  it.each([null, "", "https://ailleurs.example/x.jpg"])("renvoie null pour un chemin absent ou étranger (%s)", (path) => {
    expect(posterUrl(path, "w185")).toBeNull();
  });
});

describe("backdropUrl", () => {
  it("construit l'adresse de l'image de fond, null si absente ou étrangère", () => {
    expect(backdropUrl("/fond.jpg", "w780")).toBe("https://image.tmdb.org/t/p/w780/fond.jpg");
    expect(backdropUrl(null, "w300")).toBeNull();
    expect(backdropUrl("https://ailleurs.example/x.jpg", "w300")).toBeNull();
  });
});
