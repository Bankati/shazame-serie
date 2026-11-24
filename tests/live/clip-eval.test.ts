import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { afterAll, describe, expect, it } from "vitest";

import { getVisionProvider } from "@/server/ai/openai-vision-provider";
import type { VisionProvider } from "@/server/ai/vision-provider";
import { getCatalog } from "@/server/catalog/tmdb/tmdb-catalog";
import {
  type CaseResult,
  evalManifestSchema,
  formatReport,
  judgeResponse,
  summarize,
  titleKey,
} from "@/server/eval/clip-eval";
import { identifyClip } from "@/server/identification/identify";
import { createQuotaService } from "@/server/quota/quota";
import { createMemoryQuotaStore } from "@/server/quota/quota-store";

import { extractClipFrames } from "./support/clip-frames";

// Eval des extraits (U13, CDC 9.2 et 17) : `npm run eval`. Les extraits restent hors du dépôt (Q5) : dossier
// indiqué par EVAL_DIR (.env.local), avec son manifest.json (modèle : eval/manifest.example.json). Pipeline réel
// (IA et TMDB, quelques centimes par extrait) sans cache, sans quota ni écriture en base. Jamais en CI.
const EVAL_DIR = process.env.EVAL_DIR ?? "";
const MANIFEST = path.join(EVAL_DIR, "manifest.json");
const LABEL = process.env.EVAL_LABEL ?? "images.v1";
const REPORT_DIR = path.join(process.cwd(), "eval-results");
const UNLIMITED = { visitorDaily: 1_000_000, freeDaily: 1_000_000, premiumDailyCap: 1_000_000 };

const manifest =
  EVAL_DIR && existsSync(MANIFEST) ? evalManifestSchema.parse(JSON.parse(readFileSync(MANIFEST, "utf8"))) : null;
const RESULTS: CaseResult[] = [];

describe.skipIf(!manifest)("eval des extraits", () => {
  it.each(manifest?.clips ?? [])(
    "$file",
    async (clip) => {
      let costMicroEur = 0;
      const vision = getVisionProvider();
      // Le coût de chaque appel est relevé au passage ; la garde de dépense n'intervient pas (environnement local).
      const counted: VisionProvider = {
        identify: async (images, context) => {
          const result = await vision.identify(images, context);
          costMicroEur += result.costMicroEur;
          return result;
        },
        identifyFromText: (text, context) => vision.identifyFromText(text, context),
        identifyFromLink: (link, context) => vision.identifyFromLink(link, context),
      };

      const started = performance.now();
      let result: CaseResult;
      try {
        const frames = await extractClipFrames(path.join(EVAL_DIR, clip.file), clip.startS);
        if (frames.length < 2) {
          result = {
            clip,
            verdict: "error",
            shown: null,
            confidence: null,
            latencyMs: 0,
            costMicroEur: 0,
            framesSent: frames.length,
            detail: "moins de 2 images exploitables",
          };
        } else {
          const outcome = await identifyClip(
            {
              quota: createQuotaService({ store: createMemoryQuotaStore(), limits: async () => UNLIMITED }),
              vision: counted,
              catalog: getCatalog(),
              // Sans cache : chaque extrait est réellement analysé (option jamais exposée par l'API).
              prepareLookup: async () => ({ frameHashes: [], fingerprint: `eval:${clip.file}:${Date.now()}` }),
              cache: { find: async () => null, recordHit: async () => {}, store: async () => {} },
              persist: async () => null,
            },
            { identity: { kind: "visitor", id: "eval" }, images: frames },
          );
          const latencyMs = performance.now() - started;
          result = outcome.ok
            ? {
                clip,
                verdict: judgeResponse(outcome.response, clip),
                shown:
                  outcome.response.main && outcome.response.decision !== "ask_another_clip"
                    ? titleKey(outcome.response.main)
                    : null,
                confidence: outcome.response.main?.confidence ?? null,
                latencyMs,
                costMicroEur,
                framesSent: frames.length,
              }
            : {
                clip,
                verdict: "error",
                shown: null,
                confidence: null,
                latencyMs,
                costMicroEur,
                framesSent: frames.length,
                detail: outcome.code,
              };
        }
      } catch (error) {
        result = {
          clip,
          verdict: "error",
          shown: null,
          confidence: null,
          latencyMs: performance.now() - started,
          costMicroEur,
          framesSent: 0,
          detail: error instanceof Error ? error.message : "erreur",
        };
      }
      RESULTS.push(result);
      expect(result.verdict).toBeDefined();
    },
    120_000,
  );

  afterAll(() => {
    const summary = summarize(RESULTS);
    const report = formatReport(summary, RESULTS, LABEL);
    // Vitest peut avaler la console d'un afterAll : le rapport est aussi écrit dans eval-results/ (ignoré par git).
    mkdirSync(REPORT_DIR, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 16).replace(":", "h");
    writeFileSync(path.join(REPORT_DIR, `extraits-${stamp}.txt`), report);
    writeFileSync(
      path.join(REPORT_DIR, `extraits-${stamp}.json`),
      JSON.stringify({ label: LABEL, summary, results: RESULTS }, null, 2),
    );
    process.stdout.write(report);
  });
});
