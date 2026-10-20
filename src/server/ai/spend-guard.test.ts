import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { estimateMaxCostMicroEur, SpendGuardedVisionProvider, spendKey } from "./spend-guard";
import { createMemorySpendStore } from "./spend-store";
import { VisionError, type VisionProvider, type VisionResult } from "./vision-provider";

const MODEL = "gpt-6.1-sol";
const NOW = new Date("2026-07-14T10:00:00Z");
const DAY = "2026-07-14";
const IMAGES = [Buffer.from("a"), Buffer.from("b"), Buffer.from("c"), Buffer.from("d"), Buffer.from("e")];

function result(costMicroEur: number): VisionResult {
  return {
    answer: { recognized: false, confidence: 0, alternatives: [] },
    provider: "openai",
    model: MODEL,
    promptVersion: "identify.v1",
    attempts: 1,
    latencyMs: 10,
    usage: { inputTokens: 1, cachedInputTokens: 0, outputTokens: 1 },
    costMicroEur,
  };
}

function setup(cap: number, identify: VisionProvider["identify"] = async () => result(1_800)) {
  const store = createMemorySpendStore(() => NOW.getTime());
  const inner = { identify: vi.fn(identify), identifyFromText: vi.fn(async () => result(300)) };
  const recordSpend = vi.fn(async () => {});
  const onCapReached = vi.fn(async () => {});
  const guard = new SpendGuardedVisionProvider({
    inner,
    model: MODEL,
    store,
    dailyCapMicroEur: async () => cap,
    recordSpend,
    onCapReached,
    now: () => NOW,
  });
  return { guard, inner, store, recordSpend, onCapReached };
}

describe("estimateMaxCostMicroEur", () => {
  it("couvre le pire cas (5 images, sortie maximale, 3 tentatives) et reste sous 10 centimes", () => {
    const estimate = estimateMaxCostMicroEur(MODEL, 5);
    expect(estimate).toBeGreaterThan(1_800 * 10);
    expect(estimate).toBeLessThan(100_000);
  });

  it("refuse un modèle sans tarif", () => {
    expect(() => estimateMaxCostMicroEur("modele-inconnu")).toThrow(VisionError);
  });
});

describe("SpendGuardedVisionProvider", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("description (U35) : même plafond ; estimation sans image ; coût réel enregistré", async () => {
    const paused = setup(0);
    await expect(paused.guard.identifyFromText("un homme revit la même journée")).rejects.toMatchObject({ reason: "paused" });
    expect(paused.inner.identifyFromText).not.toHaveBeenCalled();

    const { guard, inner, recordSpend } = setup(1_000_000);
    await guard.identifyFromText("un homme revit la même journée");
    expect(inner.identifyFromText).toHaveBeenCalledWith("un homme revit la même journée", undefined);
    expect(recordSpend).toHaveBeenCalledWith(DAY, 300);
    expect(estimateMaxCostMicroEur(MODEL, 0)).toBeLessThan(estimateMaxCostMicroEur(MODEL, 1));
  });

  it("plafond à 0 : aucun appel au modèle, pause, alerte envoyée une seule fois", async () => {
    const { guard, inner, onCapReached } = setup(0);

    await expect(guard.identify(IMAGES)).rejects.toMatchObject({ reason: "paused" });
    await expect(guard.identify(IMAGES)).rejects.toMatchObject({ reason: "paused" });

    expect(inner.identify).not.toHaveBeenCalled();
    expect(onCapReached).toHaveBeenCalledTimes(1);
    expect(onCapReached).toHaveBeenCalledWith(DAY, 0);
  });

  it("réserve le coût maximal puis ne garde que le coût réel, enregistré dans le cumul du jour", async () => {
    const { guard, store, recordSpend } = setup(10_000_000);

    await guard.identify(IMAGES);

    expect(await store.spent(spendKey(DAY))).toBe(1_800);
    expect(recordSpend).toHaveBeenCalledWith(DAY, 1_800);
  });

  it("compte la dépense d'un échec déjà facturé", async () => {
    const { guard, store } = setup(10_000_000, async () => {
      throw new VisionError("unavailable", 900);
    });

    await expect(guard.identify(IMAGES)).rejects.toMatchObject({ reason: "unavailable" });
    expect(await store.spent(spendKey(DAY))).toBe(900);
  });

  it("20 identifications simultanées avec un plafond de 2 coûts maximaux : au plus 2 appels, plafond jamais dépassé", async () => {
    const estimate = estimateMaxCostMicroEur(MODEL, IMAGES.length);
    const cap = 2 * estimate;
    // Pire cas : chaque appel coûte réellement le maximum estimé, et ils se chevauchent.
    const { guard, inner, store } = setup(cap, async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return result(estimate);
    });

    const outcomes = await Promise.allSettled(Array.from({ length: 20 }, () => guard.identify(IMAGES)));

    expect(inner.identify).toHaveBeenCalledTimes(2);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(2);
    expect(await store.spent(spendKey(DAY))).toBeLessThanOrEqual(cap);
  });

  it("libère la marge : après des appels bon marché, d'autres identifications restent possibles", async () => {
    const estimate = estimateMaxCostMicroEur(MODEL, IMAGES.length);
    const { guard, inner } = setup(2 * estimate);

    for (let index = 0; index < 10; index++) {
      await guard.identify(IMAGES);
    }
    expect(inner.identify).toHaveBeenCalledTimes(10);
  });
});
