import {
  BLUR_MIN_LAPLACIAN_VARIANCE,
  DARK_MAX_MEAN_LUMINANCE,
  DUPLICATE_MAX_HAMMING,
  MIN_USABLE_FRAMES,
} from "./constants";
import { hammingDistance } from "./analysis";

export type RejectReason = "dark" | "blurry" | "duplicate";

export type FrameMetrics = {
  meanLuminance: number;
  sharpness: number;
  hash: bigint;
};

export type FrameVerdict = { kept: true } | { kept: false; reason: RejectReason };

/**
 * Juge une image candidate par rapport à celles déjà retenues (contrôles dans l'ordre :
 * noire, floue, doublon). Une image noire est souvent aussi « floue » : la raison la plus parlante gagne.
 */
export function judgeFrame(metrics: FrameMetrics, keptHashes: readonly bigint[]): FrameVerdict {
  if (metrics.meanLuminance < DARK_MAX_MEAN_LUMINANCE) {
    return { kept: false, reason: "dark" };
  }
  if (metrics.sharpness < BLUR_MIN_LAPLACIAN_VARIANCE) {
    return { kept: false, reason: "blurry" };
  }
  if (keptHashes.some((hash) => hammingDistance(hash, metrics.hash) <= DUPLICATE_MAX_HAMMING)) {
    return { kept: false, reason: "duplicate" };
  }
  return { kept: true };
}

/** Juge une suite de candidates dans l'ordre du clip. */
export function judgeFrames(frames: readonly FrameMetrics[]): FrameVerdict[] {
  const keptHashes: bigint[] = [];
  return frames.map((metrics) => {
    const verdict = judgeFrame(metrics, keptHashes);
    if (verdict.kept) {
      keptHashes.push(metrics.hash);
    }
    return verdict;
  });
}

/** Au moins 2 images exploitables : sinon on demande un autre clip (CDC 12.1). */
export function hasEnoughFrames(verdicts: readonly FrameVerdict[]): boolean {
  return verdicts.filter((verdict) => verdict.kept).length >= MIN_USABLE_FRAMES;
}
