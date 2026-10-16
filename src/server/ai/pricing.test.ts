import { describe, expect, it } from "vitest";

import { costMicroEur, isPricedModel, USD_TO_EUR } from "./pricing";

describe("costMicroEur", () => {
  it("applique le tarif du modèle puis le taux USD → EUR, arrondi au micro-euro supérieur", () => {
    // gpt-6.1-sol : 2 $ / M en entrée, 10 $ / M en sortie → 2 000 × 2 + 150 × 10 = 5 500 micro-dollars.
    expect(costMicroEur("gpt-6.1-sol", { inputTokens: 2_000, cachedInputTokens: 0, outputTokens: 150 })).toBe(
      Math.ceil(5_500 * USD_TO_EUR),
    );
  });

  it("facture les jetons en cache au tarif réduit", () => {
    // 1 000 jetons dont 800 en cache : 200 × 2 + 800 × 0,1 = 480 micro-dollars.
    expect(costMicroEur("gpt-6.1-sol", { inputTokens: 1_000, cachedInputTokens: 800, outputTokens: 0 })).toBe(
      Math.ceil(480 * USD_TO_EUR),
    );
  });

  it("reste dans la cible de 0,015 € pour une identification type à 4 images (CDC 15.1)", () => {
    expect(costMicroEur("gpt-6.1-sol", { inputTokens: 4_600, cachedInputTokens: 0, outputTokens: 300 })).toBeLessThan(15_000);
  });

  it("refuse de chiffrer un modèle sans tarif", () => {
    expect(isPricedModel("modele-inconnu")).toBe(false);
    expect(() => costMicroEur("modele-inconnu", { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1 })).toThrow();
  });
});
