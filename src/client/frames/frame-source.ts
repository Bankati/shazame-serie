import { ClipError } from "./clip-error";

// Lecture des images d'une vidéo, dans le navigateur (invariant 1 : la vidéo n'est lue que localement).
// Deux sources au même contrat : lecture native (`<video>`, chemin normal) et lecture de secours
// (ffmpeg.wasm, ffmpeg-source.ts) quand le navigateur ne sait pas décoder la vidéo (AD-40).
// Pièges mobiles (library-docs.md) : `muted` + `playsInline`, attendre `seeked` après chaque déplacement,
// délai maximal par étape (certains MOV HEVC ne se décodent pas), libérer l'URL de la vidéo.

export type SourceFrame = { image: CanvasImageSource; width: number; height: number; release?: () => void };

export type FrameSource = {
  kind: "native" | "ffmpeg";
  durationS: number;
  /** URL locale (blob:) lisible par un `<video>` pour l'aperçu du passage ; lecture native seulement. */
  previewUrl: string | null;
  /** Image affichée à l'instant demandé ; `release` libère sa mémoire une fois dessinée. */
  frameAt(timestampS: number, signal?: AbortSignal): Promise<SourceFrame>;
  close(): void;
};

const METADATA_TIMEOUT_MS = 15_000;
const SEEK_TIMEOUT_MS = 8_000;
// Position « très loin » qui force le navigateur à calculer la durée d'un WebM qui ne l'indique pas.
const FAR_SEEK_S = 1e7;

/** Lecture native ; `ClipError("unreadable")` si le navigateur ne lit pas la vidéo (la lecture de secours prend le relais). */
export async function openNativeSource(file: Blob, signal?: AbortSignal): Promise<FrameSource> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";

  const close = () => {
    URL.revokeObjectURL(url);
    video.removeAttribute("src");
    video.load();
  };

  try {
    const metadata = waitForEvent(video, "loadedmetadata", METADATA_TIMEOUT_MS, signal);
    video.src = url;
    await metadata;
    await resolveUnknownDuration(video, signal);
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.videoWidth === 0 || video.videoHeight === 0) {
      throw new ClipError("unreadable");
    }
  } catch (error) {
    close();
    throw error;
  }

  return {
    kind: "native",
    durationS: video.duration,
    previewUrl: url,
    async frameAt(timestampS, frameSignal) {
      const seeked = waitForEvent(video, "seeked", SEEK_TIMEOUT_MS, frameSignal);
      video.currentTime = timestampS;
      await seeked;
      return { image: video, width: video.videoWidth, height: video.videoHeight };
    },
    close,
  };
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

export function abortError(): DOMException {
  return new DOMException("Extraction annulée", "AbortError");
}
