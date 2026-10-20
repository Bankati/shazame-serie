import { ClipError } from "./clip-error";
import type { SourceFrame } from "./frame-source";
import { isHeicFile } from "./select-files";

// Décodage d'une capture dans le navigateur (U34) ; l'image ne quitte pas l'appareil avant d'être réduite à
// 768 px et réencodée. HEIC (photo d'iPhone) : Safari le décode lui-même ; ailleurs, `heic-to` (LGPL-3.0,
// non modifiée) est chargée seulement à ce moment-là, dans son propre fichier.

export async function decodeImage(file: File): Promise<SourceFrame> {
  try {
    return toFrame(await createImageBitmap(file, { imageOrientation: "from-image" }));
  } catch {
    if (!isHeicFile(file)) {
      throw new ClipError("image_unreadable");
    }
  }
  try {
    const { heicTo } = await import("heic-to/next");
    return toFrame(await heicTo({ blob: file, type: "bitmap", options: { imageOrientation: "from-image" } }));
  } catch {
    throw new ClipError("image_unreadable");
  }
}

function toFrame(bitmap: ImageBitmap): SourceFrame {
  return { image: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
}
