import { describe, expect, it } from "vitest";

import { formatMicroEur, formatMoney } from "./money";

// Intl sépare le symbole par une espace insécable (U+202F ou U+00A0 selon la version) : on la normalise.
const plain = (text: string) => text.replace(/\s/gu, " ");

describe("formatMoney", () => {
  it("affiche les centimes en euros, à la française", () => {
    expect(plain(formatMoney(299, "eur"))).toBe("2,99 €");
    expect(plain(formatMoney(2499, "EUR"))).toBe("24,99 €");
  });
});

describe("formatMicroEur", () => {
  it("4 décimales sous 1 €, 2 au-delà", () => {
    expect(plain(formatMicroEur(4_000))).toBe("0,004 €");
    expect(plain(formatMicroEur(0))).toBe("0,00 €");
    expect(plain(formatMicroEur(12_345_678))).toBe("12,35 €");
  });
});
