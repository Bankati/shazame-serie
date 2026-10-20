import "server-only";

import OpenAI, { APIConnectionError, InternalServerError, RateLimitError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { env } from "@/server/env";
import { log } from "@/server/log";

import { costMicroEur, isPricedModel } from "./pricing";
import {
  DESCRIBE_INSTRUCTIONS,
  DESCRIBE_MAX_ALTERNATIVES,
  DESCRIBE_PROMPT_VERSION,
  describeUserText,
} from "./prompts/describe.v1";
import { IDENTIFY_INSTRUCTIONS, IDENTIFY_PROMPT_VERSION, identifyUserText } from "./prompts/identify.v1";
import {
  IDENTIFY_IMAGES_INSTRUCTIONS,
  IDENTIFY_IMAGES_PROMPT_VERSION,
  identifyImagesUserText,
} from "./prompts/identify-images.v1";
import { LINK_INSTRUCTIONS, LINK_MAX_ALTERNATIVES, LINK_PROMPT_VERSION, linkUserText } from "./prompts/link.v1";
import { withRetries } from "./retry";
import {
  type LinkClues,
  modelAnswerSchema,
  normalizeAnswer,
  type VisionContext,
  type VisionProvider,
  type VisionResult,
  type VisionUsage,
  VisionError,
} from "./vision-provider";

// Seul module (avec src/server/ai/**) autorisé à importer le SDK OpenAI (invariant 2, règle ESLint).
// Les images partent en base64 et ne sont pas conservées par OpenAI (`store: false`, RG7).

const ATTEMPT_TIMEOUT_MS = 12_000;
/** Plafond de jetons de sortie d'une tentative (sert aussi au coût maximal estimé, U14). */
export const MAX_OUTPUT_TOKENS = 800;
const PROVIDER = "openai";

type ImageDetail = "low" | "high" | "auto" | "original";
type ReasoningEffort = "none" | "minimal" | "low" | "medium" | "high";

type UserContent = (
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string; detail: ImageDetail }
)[];

/** Sous-ensemble du client OpenAI utilisé : permet de le simuler dans les tests. */
export type ResponsesClient = Pick<OpenAI["responses"], "parse">;

export type OpenAIVisionOptions = {
  client: ResponsesClient;
  model: string;
  detail: ImageDetail;
  reasoningEffort?: ReasoningEffort;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
};

export class OpenAIVisionProvider implements VisionProvider {
  constructor(private readonly options: OpenAIVisionOptions) {}

  identify(images: readonly Buffer[], context: VisionContext = {}): Promise<VisionResult> {
    const prompt = promptFor(context.mode ?? "clip");
    const content: UserContent = [
      { type: "input_text", text: prompt.userText(images.length) },
      ...images.map((image) => ({
        type: "input_image" as const,
        image_url: `data:image/jpeg;base64,${image.toString("base64")}`,
        detail: this.options.detail,
      })),
    ];
    return this.run(prompt.version, prompt.instructions, content, context.signal);
  }

  /** Description (U35) : texte seul, placé entre balises pour que le modèle le traite comme une donnée. */
  async identifyFromText(text: string, context: { signal?: AbortSignal } = {}): Promise<VisionResult> {
    const result = await this.run(
      DESCRIBE_PROMPT_VERSION,
      DESCRIBE_INSTRUCTIONS,
      [{ type: "input_text", text: describeUserText(text) }],
      context.signal,
    );
    // 3 propositions au plus (U35) : le titre principal et 2 alternatives.
    return { ...result, answer: { ...result.answer, alternatives: result.answer.alternatives.slice(0, DESCRIBE_MAX_ALTERNATIVES) } };
  }

  async identifyFromLink(link: LinkClues, context: { signal?: AbortSignal } = {}): Promise<VisionResult> {
    const content: UserContent = [
      {
        type: "input_text",
        text: linkUserText({ ...link, hasThumbnail: link.thumbnail !== null }),
      },
      ...(link.thumbnail
        ? [{ type: "input_image" as const, image_url: `data:image/jpeg;base64,${link.thumbnail.toString("base64")}`, detail: this.options.detail }]
        : []),
    ];
    const result = await this.run(LINK_PROMPT_VERSION, LINK_INSTRUCTIONS, content, context.signal);
    return { ...result, answer: { ...result.answer, alternatives: result.answer.alternatives.slice(0, LINK_MAX_ALTERNATIVES) } };
  }

  private async run(promptVersion: string, instructions: string, content: UserContent, signal?: AbortSignal): Promise<VisionResult> {
    const { client, model, reasoningEffort, sleep, now = Date.now } = this.options;
    // Sans tarif, impossible de compter la dépense (RG5) : on n'appelle pas le modèle.
    if (!isPricedModel(model)) {
      throw new VisionError("unpriced_model");
    }

    const usage: VisionUsage = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 };
    let spent = 0;
    let attempts = 0;
    const startedAt = now();

    try {
      const answer = await withRetries(
        async () => {
          attempts += 1;
          const response = await client.parse(
            {
              model,
              instructions,
              input: [{ role: "user", content }],
              text: { format: zodTextFormat(modelAnswerSchema, "identification") },
              max_output_tokens: MAX_OUTPUT_TOKENS,
              store: false,
              ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
            },
            { timeout: ATTEMPT_TIMEOUT_MS, maxRetries: 0, signal },
          );

          // Toute réponse reçue est facturée, même refusée ou incomplète.
          if (response.usage) {
            const attemptUsage = {
              inputTokens: response.usage.input_tokens,
              cachedInputTokens: response.usage.input_tokens_details?.cached_tokens ?? 0,
              outputTokens: response.usage.output_tokens,
            };
            usage.inputTokens += attemptUsage.inputTokens;
            usage.cachedInputTokens += attemptUsage.cachedInputTokens;
            usage.outputTokens += attemptUsage.outputTokens;
            spent += costMicroEur(model, attemptUsage);
          }

          if (hasRefusal(response.output)) {
            throw new VisionError("refused");
          }
          const parsed = modelAnswerSchema.safeParse(response.output_parsed);
          if (!parsed.success) {
            throw new VisionError("invalid_response");
          }
          return normalizeAnswer(parsed.data);
        },
        { isRetryable: isTransient, sleep, signal },
      );

      return {
        answer,
        provider: PROVIDER,
        model,
        promptVersion,
        attempts,
        latencyMs: now() - startedAt,
        usage,
        costMicroEur: spent,
      };
    } catch (error) {
      const reason = error instanceof VisionError ? error.reason : "unavailable";
      log.warn("ai.identify_failed", { provider: PROVIDER, model, reason, attempts, status: statusOf(error) });
      throw new VisionError(reason, spent);
    }
  }
}

/** Consigne selon le mode : images d'un clip (identify.v1, inchangée) ou captures (identify-images.v1, U34). */
function promptFor(mode: NonNullable<VisionContext["mode"]>) {
  return mode === "images"
    ? { version: IDENTIFY_IMAGES_PROMPT_VERSION, instructions: IDENTIFY_IMAGES_INSTRUCTIONS, userText: identifyImagesUserText }
    : { version: IDENTIFY_PROMPT_VERSION, instructions: IDENTIFY_INSTRUCTIONS, userText: identifyUserText };
}

/** Panne passagère : délai dépassé ou connexion (APIConnectionError), saturation (429), erreur serveur (5xx). */
export function isTransient(error: unknown): boolean {
  return error instanceof APIConnectionError || error instanceof RateLimitError || error instanceof InternalServerError;
}

function hasRefusal(output: readonly unknown[]): boolean {
  return output.some(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      "content" in item &&
      Array.isArray(item.content) &&
      item.content.some((part: unknown) => typeof part === "object" && part !== null && "type" in part && part.type === "refusal"),
  );
}

function statusOf(error: unknown): number | null {
  return typeof error === "object" && error !== null && "status" in error && typeof error.status === "number" ? error.status : null;
}

let provider: OpenAIVisionProvider | undefined;

/** Fournisseur applicatif ; lève si OpenAI n'est pas configuré. */
export function getVisionProvider(): OpenAIVisionProvider {
  if (!provider) {
    if (!env.OPENAI_API_KEY) {
      throw new VisionError("unavailable");
    }
    provider = new OpenAIVisionProvider({
      client: new OpenAI({ apiKey: env.OPENAI_API_KEY, maxRetries: 0 }).responses,
      model: env.OPENAI_VISION_MODEL,
      detail: env.OPENAI_IMAGE_DETAIL,
      reasoningEffort: env.OPENAI_REASONING_EFFORT,
    });
  }
  return provider;
}
