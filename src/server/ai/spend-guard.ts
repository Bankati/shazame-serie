import "server-only";

import { nextParisMidnight, parisDay } from "@/lib/paris-time";
import { log } from "@/server/log";

import { MAX_OUTPUT_TOKENS } from "./openai-vision-provider";
import { MODEL_PRICES_USD_PER_MILLION, USD_TO_EUR } from "./pricing";
import { MAX_ATTEMPTS } from "./retry";
import type { SpendStore } from "./spend-store";
import { VisionError, type VisionProvider, type VisionResult } from "./vision-provider";

// Garde de dépense (RG5, invariant 2) : enveloppe le fournisseur de vision, de sorte qu'aucun appel au modèle
// ne puisse contourner le plafond quotidien. Le coût maximal est réservé avant l'appel, puis ajusté au coût réel.

/** Jetons d'entrée maximaux comptés par image (le détail `auto` en 768 px en consomme ≈ 400 : marge ×4). */
export const MAX_INPUT_TOKENS_PER_IMAGE = 1_600;
/** Consigne et message d'accompagnement (≈ 600 jetons mesurés, avec marge). */
export const PROMPT_TOKENS_ESTIMATE = 1_500;
export const MAX_IMAGES = 5;
/** Marge après minuit avant l'expiration du compteur : un ajustement tardif retrouve encore sa clé. */
const KEY_EXPIRY_MARGIN_MS = 60 * 60 * 1000;

/** Pire cas d'une identification en micro-euros : 5 images, sortie maximale, 3 tentatives (RG16). */
export function estimateMaxCostMicroEur(model: string, imageCount: number = MAX_IMAGES): number {
  const price = MODEL_PRICES_USD_PER_MILLION[model];
  if (!price) {
    throw new VisionError("unpriced_model");
  }
  const inputTokens = PROMPT_TOKENS_ESTIMATE + MAX_INPUT_TOKENS_PER_IMAGE * Math.min(imageCount, MAX_IMAGES);
  const microUsdPerAttempt = inputTokens * price.input + MAX_OUTPUT_TOKENS * price.output;
  return Math.ceil(microUsdPerAttempt * MAX_ATTEMPTS * USD_TO_EUR);
}

export function spendKey(day: string): string {
  return `ai:spend:${day}`;
}

export type SpendGuardOptions = {
  inner: VisionProvider;
  model: string;
  store: SpendStore;
  /** Plafond du jour en micro-euros (`app_settings.ai_daily_cap_micro_eur`). */
  dailyCapMicroEur: () => Promise<number>;
  /** Cumul durable dans `ai_spend_daily` (tableau de bord admin). */
  recordSpend: (day: string, costMicroEur: number) => Promise<void>;
  /** Alerte admin, appelée une seule fois par jour au premier refus. */
  onCapReached: (day: string, capMicroEur: number) => Promise<void>;
  now?: () => Date;
};

export class SpendGuardedVisionProvider implements VisionProvider {
  constructor(private readonly options: SpendGuardOptions) {}

  async identify(images: readonly Buffer[], context?: { signal?: AbortSignal }): Promise<VisionResult> {
    const { inner, model, store, now = () => new Date() } = this.options;
    const instant = now();
    const day = parisDay(instant);
    const key = spendKey(day);
    const expiresAtMs = nextParisMidnight(instant).getTime() + KEY_EXPIRY_MARGIN_MS;

    const estimate = estimateMaxCostMicroEur(model, images.length);
    const cap = await this.options.dailyCapMicroEur();
    const reservation = await store.reserve(key, estimate, cap, expiresAtMs);
    if (!reservation.reserved) {
      await this.alertOnce(day, cap, expiresAtMs);
      throw new VisionError("paused");
    }

    let actual = 0;
    try {
      const result = await inner.identify(images, context);
      actual = result.costMicroEur;
      return result;
    } catch (error) {
      // Un échec peut avoir été facturé (tentatives ratées) : ce coût compte aussi dans le plafond.
      actual = error instanceof VisionError ? error.costMicroEur : 0;
      throw error;
    } finally {
      await this.settle(key, day, estimate, actual);
    }
  }

  private async settle(key: string, day: string, estimate: number, actual: number): Promise<void> {
    try {
      await this.options.store.adjust(key, actual - estimate);
    } catch {
      // La réservation reste au coût maximal : le plafond est atteint plus tôt, jamais dépassé.
      log.warn("ai.spend_adjust_failed");
    }
    if (actual > 0) {
      await this.options.recordSpend(day, actual).catch(() => log.warn("ai.spend_record_failed"));
    }
  }

  private async alertOnce(day: string, cap: number, expiresAtMs: number): Promise<void> {
    try {
      if (await this.options.store.markOnce(`ai:alert:${day}`, expiresAtMs)) {
        log.error("ai.spend_cap_reached", { day, cap_micro_eur: cap });
        await this.options.onCapReached(day, cap);
      }
    } catch {
      log.warn("ai.spend_alert_failed");
    }
  }
}
