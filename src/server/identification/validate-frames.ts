import "server-only";

import sharp from "sharp";

import type { FrameMode } from "@/schemas/identify";
import { MAX_USABLE_FRAMES, MIN_USABLE_FRAMES, MIN_USABLE_IMAGES, PACKAGE_MAX_BYTES } from "@/shared/frames/constants";

// Invariant 1 : 2 à 5 images JPEG tirées d'un clip, ou 1 à 5 captures (mode image, AD-38) ; 1,5 Mo au total,
// type réel vérifié (pas seulement le type annoncé). Le navigateur envoie du 768 px ; on accepte jusqu'à
// 2 048 px pour borner le coût de décodage.
const MAX_DIMENSION_PX = 2_048;

export type FramesCheck = { ok: true; images: Buffer[] } | { ok: false; reason: "count" | "size" | "type" };

/** Nombre minimal d'images selon le mode : un clip en fournit au moins 2, une capture peut être seule. */
export function minFrames(mode: FrameMode): number {
  return mode === "images" ? MIN_USABLE_IMAGES : MIN_USABLE_FRAMES;
}

export async function validateFrames(
  entries: readonly FormDataEntryValue[],
  { minCount = MIN_USABLE_FRAMES }: { minCount?: number } = {},
): Promise<FramesCheck> {
  const files = entries.filter((entry): entry is File => typeof entry !== "string");
  if (files.length !== entries.length || files.length < minCount || files.length > MAX_USABLE_FRAMES) {
    return { ok: false, reason: "count" };
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > PACKAGE_MAX_BYTES) {
    return { ok: false, reason: "size" };
  }

  const images = await Promise.all(files.map(async (file) => Buffer.from(await file.arrayBuffer())));
  for (const image of images) {
    if (!(await isRealJpeg(image))) {
      return { ok: false, reason: "type" };
    }
  }
  return { ok: true, images };
}

async function isRealJpeg(image: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(image).metadata();
    return (
      metadata.format === "jpeg" &&
      (metadata.width ?? 0) > 0 &&
      (metadata.height ?? 0) > 0 &&
      (metadata.width ?? 0) <= MAX_DIMENSION_PX &&
      (metadata.height ?? 0) <= MAX_DIMENSION_PX
    );
  } catch {
    return false;
  }
}
