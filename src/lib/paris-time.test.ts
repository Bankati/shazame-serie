import { describe, expect, it } from "vitest";

import { nextParisMidnight, parisDay } from "./paris-time";

describe("parisDay", () => {
  it.each([
    // Été (UTC+2) : 21 h 59 UTC = 23 h 59 Paris, 22 h 00 UTC = minuit Paris le lendemain.
    ["2026-07-14T21:59:59Z", "2026-07-14"],
    ["2026-07-14T22:00:00Z", "2026-07-15"],
    // Hiver (UTC+1).
    ["2026-12-31T22:59:59Z", "2026-12-31"],
    ["2026-12-31T23:00:00Z", "2027-01-01"],
    // Nuit du passage à l'heure d'hiver (25 octobre 2026, 3 h → 2 h).
    ["2026-10-25T00:30:00Z", "2026-10-25"],
    ["2026-10-25T22:59:59Z", "2026-10-25"],
    ["2026-10-25T23:00:00Z", "2026-10-26"],
  ])("%s → %s", (instant, day) => {
    expect(parisDay(new Date(instant))).toBe(day);
  });
});

describe("nextParisMidnight", () => {
  it.each([
    ["2026-07-14T10:00:00Z", "2026-07-14T22:00:00.000Z"],
    ["2026-12-01T10:00:00Z", "2026-12-01T23:00:00.000Z"],
    // Veille du passage à l'heure d'hiver : minuit du 25 encore en été (UTC+2).
    ["2026-10-24T12:00:00Z", "2026-10-24T22:00:00.000Z"],
    // Journée de 25 h : minuit du 26 déjà en hiver (UTC+1).
    ["2026-10-25T12:00:00Z", "2026-10-25T23:00:00.000Z"],
    // Passage à l'heure d'été (28 mars 2027, 2 h → 3 h) : journée de 23 h.
    ["2027-03-27T12:00:00Z", "2027-03-27T23:00:00.000Z"],
    ["2027-03-28T12:00:00Z", "2027-03-28T22:00:00.000Z"],
    // Juste avant minuit : le prochain minuit est dans quelques secondes.
    ["2026-07-14T21:59:59Z", "2026-07-14T22:00:00.000Z"],
  ])("après %s → %s", (instant, midnight) => {
    expect(nextParisMidnight(new Date(instant)).toISOString()).toBe(midnight);
  });

  it("donne toujours le jour suivant à Paris", () => {
    for (let hour = 0; hour < 24 * 400; hour += 7) {
      const instant = new Date(Date.UTC(2026, 0, 1) + hour * 3_600_000);
      const midnight = nextParisMidnight(instant);
      expect(midnight.getTime()).toBeGreaterThan(instant.getTime());
      expect(parisDay(midnight)).not.toBe(parisDay(instant));
      expect(parisDay(new Date(midnight.getTime() - 1))).toBe(parisDay(instant));
    }
  });
});
