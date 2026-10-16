import "server-only";

import type { VisionUsage } from "./vision-provider";

// Tarifs OpenAI standard en USD par million de jetons (https://developers.openai.com/api/docs/pricing),
// relevés le 15 octobre 2026. À revoir à chaque changement de modèle ou de tarif.
export const PRICES_CHECKED_ON = "2026-10-15";

type ModelPrice = { input: number; cachedInput: number; output: number };

export const MODEL_PRICES_USD_PER_MILLION: Readonly<Record<string, ModelPrice>> = {
  "gpt-6-astra": { input: 10, cachedInput: 1, output: 50 },
  "gpt-6.1-sol": { input: 2, cachedInput: 0.1, output: 10 },
  "gpt-5.6-sol": { input: 4, cachedInput: 0.4, output: 20 },
  "gpt-5.6-terra": { input: 2, cachedInput: 0.2, output: 12 },
  "gpt-5.6-luna": { input: 0.2, cachedInput: 0.02, output: 1.2 },
  "gpt-5.4-mini": { input: 0.75, cachedInput: 0.075, output: 4.5 },
  "gpt-4.1-mini": { input: 0.4, cachedInput: 0.1, output: 1.6 },
};

/** Taux de référence BCE du 15 octobre 2026 (1 USD = 0,89222 EUR). Révisé chaque mois (architecture.md). */
export const USD_TO_EUR = 0.89222;
export const USD_TO_EUR_CHECKED_ON = "2026-10-15";

export function isPricedModel(model: string): boolean {
  return Object.hasOwn(MODEL_PRICES_USD_PER_MILLION, model);
}

/**
 * Coût d'un appel en micro-euros, arrondi à l'entier supérieur (on ne sous-estime jamais une dépense).
 * Prix par million de jetons × jetons = micro-dollars ; puis conversion en euros.
 */
export function costMicroEur(model: string, usage: VisionUsage): number {
  const price = MODEL_PRICES_USD_PER_MILLION[model];
  if (!price) {
    throw new Error(`Tarif inconnu pour le modèle ${model}`);
  }
  const cached = Math.min(usage.cachedInputTokens, usage.inputTokens);
  const microUsd = (usage.inputTokens - cached) * price.input + cached * price.cachedInput + usage.outputTokens * price.output;
  return Math.ceil(microUsd * USD_TO_EUR);
}
