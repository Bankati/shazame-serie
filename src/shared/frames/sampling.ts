import { CANDIDATE_COUNT, CLIP_EXCERPT_S, SAMPLE_END_RATIO, SAMPLE_START_RATIO } from "./constants";

/** Passage de la vidéo où sont prélevées les images candidates, en secondes. */
export type Excerpt = { startS: number; endS: number };

/**
 * Passage analysé (AD-40) : la vidéo entière si elle dure 60 s ou moins, sinon 60 s à partir de `startS`
 * (le milieu par défaut), ramené dans les bornes de la vidéo.
 */
export function excerptWindow(durationS: number, startS?: number): Excerpt {
  if (!Number.isFinite(durationS) || durationS <= CLIP_EXCERPT_S) {
    return { startS: 0, endS: durationS };
  }
  const latest = durationS - CLIP_EXCERPT_S;
  const start = startS === undefined || !Number.isFinite(startS) ? latest / 2 : Math.min(Math.max(startS, 0), latest);
  return { startS: round(start), endS: round(start + CLIP_EXCERPT_S) };
}

/**
 * Instants (en secondes) des images candidates, répartis régulièrement entre 10 % et 90 % du passage.
 * Le navigateur et l'eval utilisent la même fonction pour extraire les mêmes images.
 */
export function sampleExcerpt({ startS, endS }: Excerpt, count: number = CANDIDATE_COUNT): number[] {
  const length = endS - startS;
  if (!Number.isFinite(length) || !Number.isFinite(startS) || length <= 0 || count < 1) {
    return [];
  }
  if (count === 1) {
    return [round(startS + length / 2)];
  }

  const start = startS + length * SAMPLE_START_RATIO;
  const span = length * (SAMPLE_END_RATIO - SAMPLE_START_RATIO);
  return Array.from({ length: count }, (_, index) => round(start + (span * index) / (count - 1)));
}

/** Instants des candidates d'une vidéo de 60 s ou moins (vidéo entière). */
export function sampleTimestamps(durationS: number, count: number = CANDIDATE_COUNT): number[] {
  return sampleExcerpt({ startS: 0, endS: durationS }, count);
}

// Au millième de seconde : évite des instants comme 2.9999999 selon les arrondis flottants.
function round(seconds: number): number {
  return Math.round(seconds * 1000) / 1000;
}
