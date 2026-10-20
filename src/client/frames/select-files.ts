import {
  CLIP_EXTENSIONS,
  IMAGE_EXTENSIONS,
  IMAGE_MAX_BYTES,
  IMAGE_MAX_COUNT,
  IMAGE_MIME_TYPES,
} from "@/shared/frames/constants";

import { CLIP_ACCEPT, type ClipProblem } from "./validate-clip";

// Zone d'envoi unique (U34, AD-42) : une vidéo lance l'identification par clip, 1 à 5 images celle par
// captures. Contrôle immédiat (type, nombre, taille), avant tout décodage.

export type FileSelection<T> =
  | { ok: true; kind: "clip"; file: T }
  | { ok: true; kind: "images"; files: T[] }
  | { ok: false; problem: ClipProblem };

type FileInfo = { name: string; type: string; size: number };

export function classifySelection<T extends FileInfo>(files: readonly T[]): FileSelection<T> {
  const videos = files.filter(isVideo);
  const [video] = videos;
  if (video) {
    if (videos.length < files.length) return { ok: false, problem: "mixed_files" };
    if (videos.length > 1) return { ok: false, problem: "several_videos" };
    return { ok: true, kind: "clip", file: video };
  }
  if (files.length === 0) return { ok: false, problem: "empty" };
  if (files.length > IMAGE_MAX_COUNT) return { ok: false, problem: "too_many_images" };
  for (const file of files) {
    if (!isImage(file)) return { ok: false, problem: "unsupported_format" };
    if (file.size === 0) return { ok: false, problem: "empty" };
    if (file.size > IMAGE_MAX_BYTES) return { ok: false, problem: "image_too_large" };
  }
  return { ok: true, kind: "images", files: [...files] };
}

/** HEIC ou HEIF (photo d'iPhone), que Chrome et Firefox ne décodent pas. */
export function isHeicFile(file: FileInfo): boolean {
  const name = file.name.toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || name.endsWith(".heic") || name.endsWith(".heif");
}

/** Valeur de l'attribut `accept` : vidéos et images (les galeries des téléphones proposent les deux). */
export const SELECTION_ACCEPT = [CLIP_ACCEPT, "image/*", ...IMAGE_EXTENSIONS].join(",");

// Vidéo : type `video/*` ou extension de vidéo connue (le contrôle du clip trie ensuite les formats).
function isVideo(file: FileInfo): boolean {
  const name = file.name.toLowerCase();
  return file.type.startsWith("video/") || (!file.type.startsWith("image/") && CLIP_EXTENSIONS.some((extension) => name.endsWith(extension)));
}

function isImage(file: FileInfo): boolean {
  if ((IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return true;
  // Type absent ou générique (Windows, certains Android, HEIC) : on se fie à l'extension.
  if (file.type === "" || file.type === "application/octet-stream" || file.type.startsWith("image/")) {
    const name = file.name.toLowerCase();
    return IMAGE_EXTENSIONS.some((extension) => name.endsWith(extension));
  }
  return false;
}
