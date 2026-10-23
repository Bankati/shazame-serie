import { z } from "zod";

import type { IdentifyResponse } from "@/schemas/identify";

// Jeu de test des extraits (U13, CDC 9.2 et 17) : le manifeste décrit les extraits (fichiers hors du dépôt, Q5)
// et le titre attendu ; le score compare ce qu'aurait vu l'utilisateur. Logique pure, testée à part ; l'exécution
// (ffmpeg, IA et TMDB réels) est dans tests/live/clip-eval.test.ts.

export const DIFFICULTIES = ["facile", "moyen", "difficile"] as const;

export const evalManifestSchema = z.object({
  clips: z
    .array(
      z.object({
        /** Chemin relatif au dossier du manifeste. */
        file: z.string().min(1),
        tmdbId: z.number().int().positive(),
        mediaType: z.enum(["movie", "tv"]),
        difficulty: z.enum(DIFFICULTIES).default("moyen"),
        /** Début du passage de 60 s pour une vidéo plus longue (sinon le milieu, comme le navigateur). */
        startS: z.number().nonnegative().optional(),
        note: z.string().optional(),
      }),
    )
    .min(1),
});

export type EvalClip = z.infer<typeof evalManifestSchema>["clips"][number];

/**
 * Verdict d'un extrait, du point de vue de l'utilisateur :
 * - `correct` : bon titre affiché en premier ;
 * - `alternative` : bon titre parmi les alternatives proposées ;
 * - `wrong` : mauvais titre affiché en premier (le pire : décompté et trompeur) ;
 * - `abstained` : « essayez un autre extrait », rien de faux affiché ;
 * - `error` : panne, images inexploitables.
 */
export type CaseVerdict = "correct" | "alternative" | "wrong" | "abstained" | "error";

export type CaseResult = {
  clip: EvalClip;
  verdict: CaseVerdict;
  /** Titre affiché en premier (`mediaType-tmdbId`), s'il y en a un. */
  shown: string | null;
  confidence: number | null;
  latencyMs: number;
  costMicroEur: number;
  framesSent: number;
  detail?: string;
};

export function titleKey(title: { mediaType: string; tmdbId: number }): string {
  return `${title.mediaType}-${title.tmdbId}`;
}

/** Verdict d'une réponse d'identification pour le titre attendu. */
export function judgeResponse(
  response: IdentifyResponse,
  expected: { mediaType: string; tmdbId: number },
): CaseVerdict {
  const target = titleKey(expected);
  if (response.decision !== "ask_another_clip" && response.main) {
    if (titleKey(response.main) === target) return "correct";
    return response.alternatives.some((title) => titleKey(title) === target) ? "alternative" : "wrong";
  }
  const proposed = [...(response.main ? [response.main] : []), ...response.alternatives];
  return proposed.some((title) => titleKey(title) === target) ? "alternative" : "abstained";
}

export type EvalSummary = {
  total: number;
  /** Bon titre en premier. */
  top1: number;
  /** Bon titre visible (premier ou alternative). */
  visible: number;
  /** Mauvais titre affiché en premier. */
  wrongShown: number;
  abstained: number;
  errors: number;
  latencyMedianMs: number;
  latencyP95Ms: number;
  costMeanEur: number;
  byDifficulty: Record<(typeof DIFFICULTIES)[number], { total: number; top1: number }>;
};

function percentile(sorted: readonly number[], ratio: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(ratio * sorted.length) - 1));
  return sorted[index] ?? 0;
}

const share = (count: number, total: number) => (total === 0 ? 0 : count / total);

export function summarize(results: readonly CaseResult[]): EvalSummary {
  const total = results.length;
  const count = (verdicts: readonly CaseVerdict[]) =>
    results.filter((result) => verdicts.includes(result.verdict)).length;
  const latencies = results.map((result) => result.latencyMs).sort((a, b) => a - b);
  const byDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => {
      const group = results.filter((result) => result.clip.difficulty === difficulty);
      return [
        difficulty,
        {
          total: group.length,
          top1: share(group.filter((result) => result.verdict === "correct").length, group.length),
        },
      ];
    }),
  ) as EvalSummary["byDifficulty"];

  return {
    total,
    top1: share(count(["correct"]), total),
    visible: share(count(["correct", "alternative"]), total),
    wrongShown: share(count(["wrong"]), total),
    abstained: share(count(["abstained"]), total),
    errors: share(count(["error"]), total),
    latencyMedianMs: percentile(latencies, 0.5),
    latencyP95Ms: percentile(latencies, 0.95),
    costMeanEur: total === 0 ? 0 : results.reduce((sum, result) => sum + result.costMicroEur, 0) / total / 1_000_000,
    byDifficulty,
  };
}

const percent = (value: number) => `${Math.round(value * 100)} %`;

/** Rapport lisible (français), consigné ensuite dans progress-tracker.md (Eval History). */
export function formatReport(summary: EvalSummary, results: readonly CaseResult[], label: string): string {
  const lines = [
    `${label} : ${summary.total} extraits`,
    `  Bon titre en premier : ${percent(summary.top1)} ; bon titre visible : ${percent(summary.visible)}`,
    `  Mauvais titre affiché : ${percent(summary.wrongShown)} ; « autre extrait » : ${percent(summary.abstained)} ; erreurs : ${percent(summary.errors)}`,
    `  Latence médiane ${Math.round(summary.latencyMedianMs)} ms, p95 ${Math.round(summary.latencyP95Ms)} ms ; coût moyen ${summary.costMeanEur.toFixed(4)} €`,
    ...DIFFICULTIES.map((difficulty) => {
      const group = summary.byDifficulty[difficulty];
      return `  ${difficulty} : ${group.total} extraits, bon titre en premier ${percent(group.top1)}`;
    }),
    ...results
      .filter((result) => result.verdict !== "correct")
      .map(
        (result) =>
          `  ${result.verdict.padEnd(11)} ${result.clip.file} (attendu ${titleKey(result.clip)}, affiché ${result.shown ?? "rien"}${result.confidence === null ? "" : `, ${result.confidence} %`})${result.detail ? ` : ${result.detail}` : ""}`,
      ),
  ];
  return `${lines.join("\n")}\n`;
}
