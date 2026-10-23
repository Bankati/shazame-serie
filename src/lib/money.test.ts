import { describe, expect, it } from "vitest";

import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("affiche les centimes en euros, à la française", () => {
    // Intl sépare le symbole par une espace insécable (U+202F ou U+00A0 selon la version) : on la normalise.
    expect(formatMoney(299, "eur").replace(/\s/gu, " ")).toBe("2,99 €");
    expect(formatMoney(2499, "EUR").replace(/\s/gu, " ")).toBe("24,99 €");
  });
});
