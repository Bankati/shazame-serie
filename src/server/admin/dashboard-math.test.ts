import { describe, expect, it } from "vitest";

import { dayRange, estimateMrrCents, fillDays, percent, sumPeriod } from "./dashboard-math";

describe("dayRange", () => {
  it("jours consécutifs jusqu'au dernier, passage de mois et d'année compris", () => {
    expect(dayRange("2027-01-02", 4)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"]);
    expect(dayRange("2026-03-29", 2)).toEqual(["2026-03-28", "2026-03-29"]);
  });
});

describe("fillDays", () => {
  it("jours sans activité à zéro, dépense rapprochée par jour", () => {
    const rows = fillDays(
      ["2026-11-20", "2026-11-21"],
      [{ day: "2026-11-21", total: 5, shown: 3, counted: 2, fromCache: 1 }],
      [{ day: "2026-11-20", totalMicroEur: 1_500, calls: 2 }],
    );
    expect(rows).toEqual([
      { day: "2026-11-20", identifications: 0, shown: 0, counted: 0, fromCache: 0, aiCostMicroEur: 1_500, aiCalls: 2 },
      { day: "2026-11-21", identifications: 5, shown: 3, counted: 2, fromCache: 1, aiCostMicroEur: 0, aiCalls: 0 },
    ]);
    expect(sumPeriod(rows)).toEqual({ identifications: 5, shown: 3, counted: 2, fromCache: 1, aiCostMicroEur: 1_500 });
  });
});

describe("percent", () => {
  it("arrondi, null sans dénominateur", () => {
    expect(percent(2, 3)).toBe(67);
    expect(percent(0, 0)).toBeNull();
  });
});

describe("estimateMrrCents", () => {
  it("mensuels à 2,99 €, annuels à 24,99 € / 12", () => {
    expect(estimateMrrCents({ monthly: 0, yearly: 0 })).toBe(0);
    expect(estimateMrrCents({ monthly: 2, yearly: 0 })).toBe(598);
    expect(estimateMrrCents({ monthly: 1, yearly: 12 })).toBe(299 + 2_499);
    expect(estimateMrrCents({ monthly: 0, yearly: 1 })).toBe(208);
  });
});
