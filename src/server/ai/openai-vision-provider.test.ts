import { APIConnectionTimeoutError, BadRequestError, RateLimitError } from "openai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OpenAIVisionProvider, type ResponsesClient } from "./openai-vision-provider";
import { costMicroEur } from "./pricing";
import { IDENTIFY_PROMPT_VERSION } from "./prompts/identify.v1";
import { VisionError } from "./vision-provider";

vi.mock("@/server/env", () => ({ env: {} }));

const IMAGES = [Buffer.from([0xff, 0xd8, 1]), Buffer.from([0xff, 0xd8, 2])];
const USAGE = { input_tokens: 2_000, input_tokens_details: { cached_tokens: 0 }, output_tokens: 150 };
const ANSWER = {
  recognized: true,
  title: "Matrix",
  originalTitle: "The Matrix",
  year: 1999,
  kind: "film",
  season: null,
  episode: null,
  confidence: 93.6,
  alternatives: [],
};

function success(parsed: unknown = ANSWER) {
  return { output: [{ type: "message", content: [{ type: "output_text", text: "{}" }] }], output_parsed: parsed, usage: USAGE };
}

function provider(parse: ReturnType<typeof vi.fn>, model = "gpt-6.1-sol") {
  const sleep = vi.fn<(ms: number) => Promise<void>>(async () => {});
  let clock = 0;
  const instance = new OpenAIVisionProvider({
    client: { parse } as unknown as ResponsesClient,
    model,
    detail: "auto",
    sleep,
    now: () => (clock += 100),
  });
  return { instance, sleep };
}

describe("OpenAIVisionProvider", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envoie les images en base64 sans stockage chez OpenAI et renvoie une réponse bornée avec son coût", async () => {
    const parse = vi.fn(async () => success());
    const { instance } = provider(parse);

    const result = await instance.identify(IMAGES);

    const [body, options] = parse.mock.calls[0] as unknown as [Record<string, unknown>, Record<string, unknown>];
    expect(body).toMatchObject({ model: "gpt-6.1-sol", store: false });
    const content = (body.input as { content: { type: string; image_url?: string; detail?: string }[] }[])[0]!.content;
    expect(content.filter((part) => part.type === "input_image")).toEqual([
      { type: "input_image", image_url: `data:image/jpeg;base64,${IMAGES[0]!.toString("base64")}`, detail: "auto" },
      { type: "input_image", image_url: `data:image/jpeg;base64,${IMAGES[1]!.toString("base64")}`, detail: "auto" },
    ]);
    expect(options).toMatchObject({ timeout: 12_000, maxRetries: 0 });

    expect(result).toMatchObject({
      answer: { recognized: true, title: "Matrix", confidence: 94 },
      model: "gpt-6.1-sol",
      promptVersion: IDENTIFY_PROMPT_VERSION,
      attempts: 1,
      costMicroEur: costMicroEur("gpt-6.1-sol", { inputTokens: 2_000, cachedInputTokens: 0, outputTokens: 150 }),
    });
  });

  it("réessaie sur une panne passagère avec délai croissant, et compte toutes les tentatives facturées", async () => {
    const parse = vi
      .fn()
      .mockRejectedValueOnce(new APIConnectionTimeoutError())
      .mockRejectedValueOnce(new RateLimitError(429, undefined, "trop de requêtes", new Headers()))
      .mockResolvedValueOnce(success());
    const { instance, sleep } = provider(parse);

    const result = await instance.identify(IMAGES);

    expect(parse).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([500, 1_500]);
    expect(result.attempts).toBe(3);
  });

  it("abandonne après 3 tentatives (RG16)", async () => {
    const parse = vi.fn().mockRejectedValue(new APIConnectionTimeoutError());
    const { instance } = provider(parse);

    await expect(instance.identify(IMAGES)).rejects.toMatchObject({ reason: "unavailable", costMicroEur: 0 });
    expect(parse).toHaveBeenCalledTimes(3);
  });

  it("ne réessaie pas une requête refusée par OpenAI (400)", async () => {
    const parse = vi.fn().mockRejectedValue(new BadRequestError(400, undefined, "requête invalide", new Headers()));
    const { instance } = provider(parse);

    await expect(instance.identify(IMAGES)).rejects.toBeInstanceOf(VisionError);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("transforme un refus du modèle en erreur, coût compris, sans nouvelle tentative", async () => {
    const parse = vi.fn(async () => ({
      output: [{ type: "message", content: [{ type: "refusal", refusal: "non" }] }],
      output_parsed: null,
      usage: USAGE,
    }));
    const { instance } = provider(parse);

    const error = await instance.identify(IMAGES).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ reason: "refused" });
    expect((error as VisionError).costMicroEur).toBeGreaterThan(0);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("refuse une réponse qui ne respecte pas le schéma", async () => {
    const parse = vi.fn(async () => success({ recognized: "oui" }));
    const { instance } = provider(parse);

    await expect(instance.identify(IMAGES)).rejects.toMatchObject({ reason: "invalid_response" });
  });

  it("n'appelle jamais un modèle dont le tarif est inconnu (plafond RG5)", async () => {
    const parse = vi.fn();
    const { instance } = provider(parse, "modele-sans-tarif");

    await expect(instance.identify(IMAGES)).rejects.toMatchObject({ reason: "unpriced_model" });
    expect(parse).not.toHaveBeenCalled();
  });
});
