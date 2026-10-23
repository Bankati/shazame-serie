import { describe, expect, it } from "vitest";

import { formatReleaseDay, formatReleaseMonth, groupByMonth } from "./release-calendar";

describe("calendrier des sorties (U42)", () => {
  it("formate le jour civil sans décalage de fuseau", () => {
    expect(formatReleaseDay("2026-12-01")).toBe("1 décembre 2026");
    expect(formatReleaseDay("2026-01-31")).toBe("31 janvier 2026");
    expect(formatReleaseMonth("2026-11-04")).toBe("Novembre 2026");
  });

  it("regroupe par mois dans l'ordre reçu, les titres sans date à la fin", () => {
    const groups = groupByMonth([
      { id: 1, releaseDate: "2026-11-04" },
      { id: 2, releaseDate: null },
      { id: 3, releaseDate: "2026-11-20" },
      { id: 4, releaseDate: "2026-12-18" },
    ]);
    expect(groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ["Novembre 2026", [1, 3]],
      ["Décembre 2026", [4]],
      [null, [2]],
    ]);
  });

  it("liste vide : aucun groupe", () => {
    expect(groupByMonth([])).toEqual([]);
  });
});
