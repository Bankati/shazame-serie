import { describe, expect, it } from "vitest";

import { isVideoFile, parseClipName, parseFolderName, titleSource } from "./clip-names";

describe("parseClipName (fichier à la racine)", () => {
  it.each([
    ["Intouchables (2011).mp4", { title: "Intouchables", year: 2011, kind: null }],
    ["Intouchables (2011) 2.mp4", { title: "Intouchables", year: 2011, kind: null }],
    ["Intouchables - 3.MOV", { title: "Intouchables", year: null, kind: null }],
    ["La Casa de Papel [serie].mp4", { title: "La Casa de Papel", year: null, kind: "serie" }],
    ["L'Attaque des Titans [série] #2.mkv", { title: "L'Attaque des Titans", year: null, kind: "serie" }],
    ["Blade_Runner_2049 (2017).webm", { title: "Blade Runner 2049", year: 2017, kind: null }],
    ["1917 (2019).mp4", { title: "1917", year: 2019, kind: null }],
    ["Your Name [film].mp4", { title: "Your Name", year: null, kind: "film" }],
  ])("%s", (file, expected) => {
    expect(parseClipName(file)).toEqual(expected);
  });

  it("nom sans titre → null", () => {
    expect(parseClipName("(2011).mp4")).toBeNull();
  });
});

describe("parseFolderName (un dossier par titre)", () => {
  it("le nom entier est le titre : points et numéros gardés", () => {
    expect(parseFolderName("Kaiju No. 8")).toEqual({ title: "Kaiju No. 8", year: null, kind: null });
    expect(parseFolderName("Dr. Stone [anime]")).toEqual({ title: "Dr. Stone", year: null, kind: "serie" });
    expect(parseFolderName("Mob Psycho 100")).toEqual({ title: "Mob Psycho 100", year: null, kind: null });
    expect(parseFolderName("Le Voyage de Chihiro (2001)")).toEqual({ title: "Le Voyage de Chihiro", year: 2001, kind: null });
  });
});

describe("titleSource", () => {
  it("dossier : titre du dossier, une seule recherche par dossier ; racine : titre du fichier", () => {
    expect(titleSource("One Piece/extrait 1.mp4")).toEqual({ source: "One Piece", name: { title: "One Piece", year: null, kind: null } });
    expect(titleSource("animes/One Piece/ep 1000.mp4").source).toBe("animes/One Piece");
    expect(titleSource("Intouchables (2011) 2.mp4")).toEqual({
      source: "Intouchables (2011) 2.mp4",
      name: { title: "Intouchables", year: 2011, kind: null },
    });
  });
});

describe("isVideoFile", () => {
  it("vidéos reconnues, manifeste et images ignorés", () => {
    expect(isVideoFile("film.MP4")).toBe(true);
    expect(isVideoFile("film.mkv")).toBe(true);
    expect(isVideoFile("manifest.json")).toBe(false);
    expect(isVideoFile("affiche.jpg")).toBe(false);
  });
});
