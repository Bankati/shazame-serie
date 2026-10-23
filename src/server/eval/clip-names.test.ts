import { describe, expect, it } from "vitest";

import { isVideoFile, parseClipName } from "./clip-names";

describe("parseClipName", () => {
  it.each([
    ["Intouchables (2011).mp4", { title: "Intouchables", year: 2011, series: false }],
    ["Intouchables (2011) 2.mp4", { title: "Intouchables", year: 2011, series: false }],
    ["Intouchables - 3.MOV", { title: "Intouchables", year: null, series: false }],
    ["La Casa de Papel [serie].mp4", { title: "La Casa de Papel", year: null, series: true }],
    ["L'Attaque des Titans [série] #2.mkv", { title: "L'Attaque des Titans", year: null, series: true }],
    ["Blade_Runner_2049 (2017).webm", { title: "Blade Runner 2049", year: 2017, series: false }],
    ["1917 (2019).mp4", { title: "1917", year: 2019, series: false }],
  ])("%s", (file, expected) => {
    expect(parseClipName(file)).toEqual(expected);
  });

  it("nom sans titre → null", () => {
    expect(parseClipName("(2011).mp4")).toBeNull();
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
