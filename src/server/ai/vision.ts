import "server-only";

import { env } from "@/server/env";

import { getVisionProvider } from "./openai-vision-provider";
import type { VisionProvider } from "./vision-provider";

/** Fournisseur de vision configuré, ou null si la clé manque (local sans clé, CI). */
export function getOpenAIVisionProviderOrNull(): VisionProvider | null {
  return env.OPENAI_API_KEY ? getVisionProvider() : null;
}
