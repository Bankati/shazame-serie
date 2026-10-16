import { dHash, laplacianVariance, meanLuminance, toGrayscale } from "@/shared/frames/analysis";
import {
  ANALYSIS_WIDTH_PX,
  DHASH_HEIGHT_PX,
  DHASH_WIDTH_PX,
  FRAME_MAX_SIZE_PX,
  JPEG_QUALITY_STEPS,
  MIN_USABLE_FRAMES,
} from "@/shared/frames/constants";
import { sampleTimestamps } from "@/shared/frames/sampling";
import { type FrameVerdict, judgeFrame } from "@/shared/frames/selection";

import { fitPackage } from "./fit-package";
import { checkClipDuration, type ClipProblem } from "./validate-clip";

// Extraction dans le navigateur (CDC 12.1, invariant 1) : la vidéo n'est lue que localement.
// Pièges mobiles (library-docs.md) : `muted` + `playsInline`, attendre `seeked` après chaque déplacement,
// délai maximal par étape (certains MOV HEVC ne se décodent pas), libérer l'URL de la vidéo.

const METADATA_TIMEOUT_MS = 15_000;
const SEEK_TIMEOUT_MS = 8_000;
// Position « très loin » qui force le navigateur à calculer la durée d'un WebM qui ne l'indique pas.
const FAR_SEEK_S = 1e7;
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
  /** JPEG retenus, prêts à l'envoi : 2 à 5 images, 1,5 Mo au total au maximum (vide si moins de 2). */
  packageBlobs: Blob[];
};

export class ClipError extends Error {
  constructor(readonly problem: ClipProblem) {
    super(`Clip refusé : ${problem}`);
    this.name = "ClipError";
  }
}

type ExtractOptions = {
  signal?: AbortSignal;
  onFrame?: (frame: CandidateFrame, total: number) => void;
};

export async function extractFrames(file: Blob, { signal, onFrame }: ExtractOptions = {}): Promise<ExtractionResult> {
  const videoUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  try {
    const metadata = waitForEvent(video, "loadedmetadata", METADATA_TIMEOUT_MS, signal);
    video.src = videoUrl;
    await metadata;
    await resolveUnknownDuration(video, signal);

    const durationCheck = checkClipDuration(video.duration);
    if (!durationCheck.ok) {
      throw new ClipError(durationCheck.problem);
    }
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      throw new ClipError("unreadable");
    }

    const size = scaleToFit(video.videoWidth, video.videoHeight, FRAME_MAX_SIZE_PX);
    const timestamps = sampleTimestamps(video.duration);
    const frames: CandidateFrame[] = [];
    const keptHashes: bigint[] = [];
    const keptCanvases: HTMLCanvasElement[] = [];
    const keptPreviews: Blob[] = [];

    for (const [index, timestampS] of timestamps.entries()) {
      const seeked = waitForEvent(video, "seeked", SEEK_TIMEOUT_MS, signal);
      video.currentTime = timestampS;
      await seeked;

      const canvas = drawFrame(video, size.width, size.height);
      const metrics = measure(canvas);
      const verdict = judgeFrame(metrics, keptHashes);
      const preview = await encodeJpeg(canvas, JPEG_QUALITY_STEPS[0]);
      if (verdict.kept) {
        keptHashes.push(metrics.hash);
        keptCanvases.push(canvas);
        keptPreviews.push(preview);
      }

      const frame: CandidateFrame = { index, timestampS, previewUrl: URL.createObjectURL(preview), verdict };
      frames.push(frame);
      onFrame?.(frame, timestamps.length);
    }

    // Premier palier de qualité = celui des aperçus : on les réutilise au lieu de réencoder.
    const packageBlobs =
      keptCanvases.length >= MIN_USABLE_FRAMES
        ? await fitPackage((quality) =>
            quality === JPEG_QUALITY_STEPS[0]
              ? Promise.resolve(keptPreviews)
              : Promise.all(keptCanvases.map((canvas) => encodeJpeg(canvas, quality))),
          )
        : [];
    return { frames, packageBlobs };
  } finally {
    URL.revokeObjectURL(videoUrl);
    video.removeAttribute("src");
    video.load();
  }
}

/**
 * Les WebM produits par MediaRecorder (enregistreurs d'écran, certaines applis) n'indiquent pas leur
 * durée : `duration` vaut Infinity. Une position très lointaine force le navigateur à la calculer.
 */
async function resolveUnknownDuration(video: HTMLVideoElement, signal?: AbortSignal): Promise<void> {
  if (video.duration !== Number.POSITIVE_INFINITY) {
    return;
  }
  const durationKnown = waitForEvent(video, "durationchange", METADATA_TIMEOUT_MS, signal);
  const seeked = waitForEvent(video, "seeked", SEEK_TIMEOUT_MS, signal).catch(() => undefined);
  video.currentTime = FAR_SEEK_S;
  await durationKnown;
  // On laisse ce déplacement se terminer avant ceux des images candidates.
  await seeked;
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

/** Attend un événement de la vidéo, avec délai maximal, erreur de décodage et annulation. */
function waitForEvent(video: HTMLVideoElement, event: string, timeoutMs: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => finish(new ClipError("unreadable")), timeoutMs);
    const onEvent = () => finish();
    const onError = () => finish(new ClipError("unreadable"));
    const onAbort = () => finish(abortError());

    function finish(error?: Error) {
      clearTimeout(timer);
      video.removeEventListener(event, onEvent);
      video.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    }

    video.addEventListener(event, onEvent);
    video.addEventListener("error", onError);
    signal?.addEventListener("abort", onAbort);
  });
}

function abortError(): DOMException {
  return new DOMException("Extraction annulée", "AbortError");
}
