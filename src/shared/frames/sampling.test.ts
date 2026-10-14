import { describe, expect, it } from "vitest";

import { sampleTimestamps } from "./sampling";

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
