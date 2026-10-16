import "server-only";

import { createHash } from "node:crypto";

import sharp from "sharp";

import { dHash } from "@/shared/frames/analysis";
import { DHASH_HEIGHT_PX, DHASH_WIDTH_PX } from "@/shared/frames/constants";

// Empreintes du cache calculées par le serveur, à partir des octets reçus (invariant 4, AD-12).
// Même dHash que le navigateur (src/shared/frames/analysis.ts), mais jamais repris de lui.

/** dHash 64 bits (non signé) d'une image : niveaux de gris, réduction à 9 × 8 pixels. */
export async function computeFrameHash(image: Buffer): Promise<bigint> {
  const { data, info } = await sharp(image)
    .greyscale()
    .resize(DHASH_WIDTH_PX, DHASH_HEIGHT_PX, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Après greyscale, sharp peut garder un canal alpha : on ne lit que le premier canal de chaque pixel.
  const pixels = new Uint8Array(DHASH_WIDTH_PX * DHASH_HEIGHT_PX);
  for (let index = 0; index < pixels.length; index++) {
    pixels[index] = data[index * info.channels] ?? 0;
  }
  return dHash({ width: DHASH_WIDTH_PX, height: DHASH_HEIGHT_PX, data: pixels });
}

export function computeFrameHashes(images: readonly Buffer[]): Promise<bigint[]> {
  return Promise.all(images.map(computeFrameHash));
}

/** Empreinte d'extrait : SHA-256 des dHash triés. L'ordre d'envoi des images ne change rien. */
export function clipFingerprint(hashes: readonly bigint[]): string {
  const sorted = [...hashes].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const text = sorted.map((hash) => hash.toString(16).padStart(16, "0")).join(",");
  return createHash("sha256").update(text).digest("hex");
}

/** PostgreSQL `bigint` est signé : même 64 bits, donc même distance de Hamming. */
export function toSignedBigint(hash: bigint): bigint {
  return BigInt.asIntN(64, hash);
}
