import { describe, expect, it } from "vitest";

import { excerptWindow, sampleExcerpt, sampleTimestamps } from "./sampling";

describe("sampleTimestamps", () => {
  it("répartit 5 instants entre 10 % et 90 % de la durée", () => {
    expect(sampleTimestamps(60)).toEqual([6, 18, 30, 42, 54]);
  });

  it("fonctionne sur un clip d'une seconde", () => {
    expect(sampleTimestamps(1)).toEqual([0.1, 0.3, 0.5, 0.7, 0.9]);
  });

  it("prend le milieu quand une seule image est demandée", () => {
    expect(sampleTimestamps(10, 1)).toEqual([5]);
  });

  it.each([0, -3, Number.NaN, Number.POSITIVE_INFINITY])("ne renvoie rien pour une durée invalide (%s)", (duration) => {
    expect(sampleTimestamps(duration)).toEqual([]);
  });
});

describe("excerptWindow", () => {
  it("vidéo de 60 s ou moins : la vidéo entière", () => {
    expect(excerptWindow(42)).toEqual({ startS: 0, endS: 42 });
    expect(excerptWindow(60, 10)).toEqual({ startS: 0, endS: 60 });
  });

  it("vidéo plus longue : les 60 s du milieu par défaut", () => {
    expect(excerptWindow(150)).toEqual({ startS: 45, endS: 105 });
  });

  it("début choisi, ramené dans les bornes", () => {
    expect(excerptWindow(150, 12.5)).toEqual({ startS: 12.5, endS: 72.5 });
    expect(excerptWindow(150, -4)).toEqual({ startS: 0, endS: 60 });
    expect(excerptWindow(150, 140)).toEqual({ startS: 90, endS: 150 });
  });
});

describe("sampleExcerpt", () => {
  it("répartit les instants dans le passage", () => {
    expect(sampleExcerpt({ startS: 45, endS: 105 })).toEqual([51, 63, 75, 87, 99]);
  });

  it("ne renvoie rien pour un passage vide", () => {
    expect(sampleExcerpt({ startS: 10, endS: 10 })).toEqual([]);
  });
});
