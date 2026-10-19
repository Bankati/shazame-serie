import { describe, expect, it } from "vitest";

import { posterUrl } from "./tmdb-image";

describe("posterUrl", () => {
  it("construit l'adresse TMDB dans la taille demandée", () => {
    expect(posterUrl("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });

  it.each([null, "", "https://ailleurs.example/x.jpg"])("renvoie null pour un chemin absent ou étranger (%s)", (path) => {
    expect(posterUrl(path, "w185")).toBeNull();
  });
});
