import { CANDIDATE_COUNT, SAMPLE_END_RATIO, SAMPLE_START_RATIO } from "./constants";

/**
 * Instants (en secondes) des images candidates, répartis régulièrement entre 10 % et 90 % de la durée.
 * Le navigateur et l'eval utilisent la même fonction pour extraire les mêmes images.
 */
export function sampleTimestamps(durationS: number, count: number = CANDIDATE_COUNT): number[] {
  if (!Number.isFinite(durationS) || durationS <= 0 || count < 1) {
    return [];
  }
  if (count === 1) {
    return [round(durationS / 2)];
  }

  const start = durationS * SAMPLE_START_RATIO;
  const span = durationS * (SAMPLE_END_RATIO - SAMPLE_START_RATIO);
  return Array.from({ length: count }, (_, index) => round(start + (span * index) / (count - 1)));
}

// Au millième de seconde : évite des instants comme 2.9999999 selon les arrondis flottants.
function round(seconds: number): number {
  return Math.round(seconds * 1000) / 1000;
}
