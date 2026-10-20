import { ClipError } from "./clip-error";
import { abortError, type FrameSource } from "./frame-source";

// Lecture de secours (AD-40) : ffmpeg.wasm, dans un worker, chargé seulement quand la lecture native échoue
// (HEVC sans décodeur, AVI, H.263…). Il ne convertit pas la vidéo : il en tire une image par instant demandé.
// Le fichier est monté en WORKERFS (lu par morceaux, jamais copié en mémoire) et ne quitte pas l'appareil.

/** Versions de `@ffmpeg/core` et `@ffmpeg/ffmpeg`, copiées dans public/ffmpeg/ par scripts/copy-ffmpeg-core.mjs. */
export const FFMPEG_CORE_VERSION = "0.12.10";
export const FFMPEG_WORKER_VERSION = "0.12.15";

const LOAD_TIMEOUT_MS = 180_000;
const COMMAND_TIMEOUT_MS = 60_000;
const INPUT_DIR = "/entree";
const PROBE_FILE = "/duree.txt";
const FRAME_FILE = "/image.jpg";
// Hauteur maximale de l'image produite : le canevas la réduit ensuite à 768 px comme en lecture native.
const FRAME_SCALE = "scale=-2:min(ih\\,768)";

type LoadProgress = (ratio: number) => void;

export async function openFfmpegSource(
  file: Blob,
  { signal, onLoadProgress }: { signal?: AbortSignal; onLoadProgress?: LoadProgress } = {},
): Promise<FrameSource> {
  const [{ FFmpeg, FFFSType }, { toBlobURL }] = await Promise.all([import("@ffmpeg/ffmpeg"), import("@ffmpeg/util")]);
  const ffmpeg = new FFmpeg();
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    signal?.removeEventListener("abort", close);
    ffmpeg.terminate();
  };
  signal?.addEventListener("abort", close);

  try {
    await withDeadline(
      (async () => {
        const base = `${window.location.origin}/ffmpeg/core-${FFMPEG_CORE_VERSION}`;
        const wasmURL = await toBlobURL(`${base}/ffmpeg-core.wasm`, "application/wasm", true, ({ received, total }) => {
          if (total > 0) onLoadProgress?.(Math.min(1, received / total));
        });
        try {
          await ffmpeg.load({
            coreURL: `${base}/ffmpeg-core.js`,
            wasmURL,
            // Worker servi tel quel (voir scripts/copy-ffmpeg-core.mjs) plutôt que celui empaqueté par Turbopack.
            classWorkerURL: `${window.location.origin}/ffmpeg/worker-${FFMPEG_WORKER_VERSION}/worker.js`,
          });
        } finally {
          URL.revokeObjectURL(wasmURL);
        }
      })(),
      LOAD_TIMEOUT_MS,
      signal,
    );

    const mounted = mountedFile(file);
    const input = `${INPUT_DIR}/${mounted.name}`;
    await ffmpeg.createDir(INPUT_DIR);
    await ffmpeg.mount(FFFSType.WORKERFS, { files: [mounted] }, INPUT_DIR);

    // ffprobe de @ffmpeg/core 0.12.10 renvoie -1 même quand il réussit : seul le fichier produit fait foi.
    await ffmpeg.ffprobe(
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", input, "-o", PROBE_FILE],
      COMMAND_TIMEOUT_MS,
    );
    const probed = await ffmpeg.readFile(PROBE_FILE, "utf8").catch(() => "");
    const durationS = Number.parseFloat(String(probed));
    if (!Number.isFinite(durationS) || durationS <= 0) {
      throw new ClipError("unreadable");
    }

    return {
      kind: "ffmpeg",
      durationS,
      previewUrl: null,
      async frameAt(timestampS, frameSignal) {
        if (closed || frameSignal?.aborted) throw abortError();
        const code = await ffmpeg.exec(
          ["-v", "error", "-ss", timestampS.toFixed(3), "-i", input, "-frames:v", "1", "-an", "-sn", "-vf", FRAME_SCALE, "-q:v", "2", FRAME_FILE],
          COMMAND_TIMEOUT_MS,
        );
        if (closed || frameSignal?.aborted) throw abortError();
        if (code !== 0) throw new ClipError("unreadable");
        const data = await ffmpeg.readFile(FRAME_FILE);
        await ffmpeg.deleteFile(FRAME_FILE);
        if (typeof data === "string" || data.length === 0) throw new ClipError("unreadable");
        const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)], { type: "image/jpeg" }));
        return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
      },
      close,
    };
  } catch (error) {
    const aborted = signal?.aborted;
    close();
    if (aborted) throw abortError();
    throw error instanceof ClipError ? error : new ClipError("unreadable");
  }
}

// Fichier monté sous un nom neutre (aucun caractère du nom d'origine dans le chemin) ; l'extension aide
// ffmpeg à reconnaître le conteneur. `new File([blob])` référence le même contenu, sans copie.
function mountedFile(file: Blob): File {
  const extension = file instanceof File ? /\.[a-z0-9]{2,4}$/i.exec(file.name)?.[0]?.toLowerCase() ?? "" : "";
  return new File([file], `video${extension}`, { type: file.type });
}

function withDeadline<T>(promise: Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => finish(() => reject(new ClipError("unreadable"))), timeoutMs);
    const onAbort = () => finish(() => reject(abortError()));
    function finish(settle: () => void) {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      settle();
    }
    signal?.addEventListener("abort", onAbort);
    promise.then(
      (value) => finish(() => resolve(value)),
      (error: unknown) => finish(() => reject(error)),
    );
  });
}
