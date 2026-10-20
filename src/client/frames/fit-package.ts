import { JPEG_QUALITY_STEPS, MIN_USABLE_FRAMES, PACKAGE_MAX_BYTES } from "@/shared/frames/constants";

/** Encode les images retenues à une qualité JPEG donnée (0 à 1). */
export type PackageEncoder = (quality: number) => Promise<Blob[]>;

/**
 * Fait tenir le paquet dans 1,5 Mo (invariant 1) : on baisse la qualité par paliers, puis, en dernier
 * recours, on retire les dernières images sans descendre sous `minCount` (2 pour un clip, 1 pour des
 * captures). Renvoie [] si c'est impossible.
 */
export async function fitPackage(encodeAt: PackageEncoder, minCount: number = MIN_USABLE_FRAMES): Promise<Blob[]> {
  let blobs: Blob[] = [];
  for (const quality of JPEG_QUALITY_STEPS) {
    blobs = await encodeAt(quality);
    if (totalSize(blobs) <= PACKAGE_MAX_BYTES) {
      return blobs;
    }
  }
  while (blobs.length > minCount && totalSize(blobs) > PACKAGE_MAX_BYTES) {
    blobs = blobs.slice(0, -1);
  }
  return totalSize(blobs) <= PACKAGE_MAX_BYTES ? blobs : [];
}

export function totalSize(blobs: readonly Blob[]): number {
  return blobs.reduce((sum, blob) => sum + blob.size, 0);
}
