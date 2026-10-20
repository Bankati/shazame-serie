import { dHash, laplacianVariance, meanLuminance, toGrayscale } from "@/shared/frames/analysis";
import {
  ANALYSIS_WIDTH_PX,
  BLANK_MAX_MEAN_LUMINANCE,
  DHASH_HEIGHT_PX,
  DHASH_WIDTH_PX,
  FRAME_MAX_SIZE_PX,
  JPEG_QUALITY_STEPS,
  MIN_USABLE_FRAMES,
  MIN_USABLE_IMAGES,
} from "@/shared/frames/constants";
import { type Excerpt, sampleExcerpt } from "@/shared/frames/sampling";
import { type FrameVerdict, judgeFrame } from "@/shared/frames/selection";

import { ClipError } from "./clip-error";
import { fitPackage } from "./fit-package";
import type { FrameSource, SourceFrame } from "./frame-source";

export { ClipError } from "./clip-error";

// Extraction dans le navigateur (CDC 12.1, invariant 1) : les images sont tirées d'une source locale
// (lecture native ou de secours, frame-source.ts), jugées, puis réencodées en JPEG pour l'envoi.

const JPEG_TYPE = "image/jpeg";

export type CandidateFrame = {
  index: number;
  timestampS: number;
  /** URL locale (blob:) de l'aperçu ; à libérer par l'appelant. */
  previewUrl: string;
  verdict: FrameVerdict;
};

export type ExtractionResult = {
  frames: CandidateFrame[];
  /** JPEG retenus, prêts à l'envoi : 2 à 5 images d'un clip (1 à 5 captures), 1,5 Mo au plus ; vide sinon. */
  packageBlobs: Blob[];
  /** Toutes les candidates sont vides : la vidéo a été « lue » sans être décodée (AD-40). */
  blank: boolean;
};

type ExtractOptions = {
  signal?: AbortSignal;
  onFrame?: (frame: CandidateFrame, total: number) => void;
};

/** Images d'un passage de la vidéo (2 exploitables au moins). */
export function extractFrames(source: FrameSource, excerpt: Excerpt, options: ExtractOptions = {}): Promise<ExtractionResult> {
  return collectFrames(sampleExcerpt(excerpt), (timestampS) => source.frameAt(timestampS, options.signal), {
    ...options,
    minUsable: MIN_USABLE_FRAMES,
  });
}

/** Captures envoyées telles quelles (U34, AD-38) : 1 exploitable suffit ; `timestampS` vaut leur rang. */
export function extractFromImages(
  count: number,
  imageAt: (index: number) => Promise<SourceFrame>,
  options: ExtractOptions = {},
): Promise<ExtractionResult> {
  return collectFrames(Array.from({ length: count }, (_, index) => index), imageAt, { ...options, minUsable: MIN_USABLE_IMAGES });
}

/** Lit chaque candidate, la réduit à 768 px, la juge (noire, floue, doublon), puis fait tenir le paquet. */
async function collectFrames(
  points: readonly number[],
  frameAt: (point: number) => Promise<SourceFrame>,
  { signal, onFrame, minUsable }: ExtractOptions & { minUsable: number },
): Promise<ExtractionResult> {
  const frames: CandidateFrame[] = [];
  const keptHashes: bigint[] = [];
  const keptCanvases: HTMLCanvasElement[] = [];
  const keptPreviews: Blob[] = [];
  let blankCount = 0;

  for (const [index, timestampS] of points.entries()) {
    if (signal?.aborted) {
      throw new DOMException("Extraction annulée", "AbortError");
    }
    const shown = await frameAt(timestampS);
    let canvas: HTMLCanvasElement;
    try {
      if (shown.width === 0 || shown.height === 0) {
        throw new ClipError("unreadable");
      }
      const size = scaleToFit(shown.width, shown.height, FRAME_MAX_SIZE_PX);
      canvas = drawFrame(shown.image, size.width, size.height);
    } finally {
      shown.release?.();
    }

    const metrics = measure(canvas);
    if (metrics.meanLuminance < BLANK_MAX_MEAN_LUMINANCE) {
      blankCount += 1;
    }
    const verdict = judgeFrame(metrics, keptHashes);
    const preview = await encodeJpeg(canvas, JPEG_QUALITY_STEPS[0]);
    if (verdict.kept) {
      keptHashes.push(metrics.hash);
      keptCanvases.push(canvas);
      keptPreviews.push(preview);
    }

    const frame: CandidateFrame = { index, timestampS, previewUrl: URL.createObjectURL(preview), verdict };
    frames.push(frame);
    onFrame?.(frame, points.length);
  }

  // Premier palier de qualité = celui des aperçus : on les réutilise au lieu de réencoder.
  const packageBlobs =
    keptCanvases.length >= minUsable
      ? await fitPackage(
          (quality) =>
            quality === JPEG_QUALITY_STEPS[0]
              ? Promise.resolve(keptPreviews)
              : Promise.all(keptCanvases.map((canvas) => encodeJpeg(canvas, quality))),
          minUsable,
        )
      : [];
  return { frames, packageBlobs, blank: points.length > 0 && blankCount === points.length };
}

function scaleToFit(width: number, height: number, maxSize: number): { width: number; height: number } {
  const scale = Math.min(1, maxSize / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function drawFrame(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  context2d(canvas).drawImage(source, 0, 0, width, height);
  return canvas;
}

function measure(frame: HTMLCanvasElement) {
  const analysisSize = scaleToFit(frame.width, frame.height, ANALYSIS_WIDTH_PX);
  const analysis = grayscaleOf(frame, analysisSize.width, analysisSize.height);
  const hashImage = grayscaleOf(frame, DHASH_WIDTH_PX, DHASH_HEIGHT_PX);
  return { meanLuminance: meanLuminance(analysis), sharpness: laplacianVariance(analysis), hash: dHash(hashImage) };
}

function grayscaleOf(source: HTMLCanvasElement, width: number, height: number) {
  const canvas = drawFrame(source, width, height);
  const pixels = context2d(canvas).getImageData(0, 0, width, height);
  return toGrayscale(pixels.data, width, height);
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new ClipError("unreadable");
  }
  return context;
}

function encodeJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ClipError("unreadable"))),
      JPEG_TYPE,
      quality,
    );
  });
}
