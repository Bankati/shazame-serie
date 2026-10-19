import "server-only";

import sharp from "sharp";

// Photo de profil (U05) : le serveur ne garde jamais le fichier envoyé tel quel. Il vérifie le type réel,
// redresse l'image selon l'EXIF, la recadre en carré et la réencode en WebP : toutes les métadonnées
// (position GPS, appareil, date) disparaissent au passage.

/** Taille maximale à l'envoi : sous la limite de corps des fonctions Vercel (4,5 Mo). */
export const AVATAR_MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const AVATAR_SIZE_PX = 256;
const MAX_INPUT_PIXELS = 40_000_000;
const ACCEPTED_FORMATS = new Set(["jpeg", "png", "webp"]);

export type AvatarImageResult = { ok: true; data: Buffer } | { ok: false; reason: "too_large" | "unsupported" };

export async function processAvatar(input: Buffer): Promise<AvatarImageResult> {
  if (input.length === 0 || input.length > AVATAR_MAX_UPLOAD_BYTES) {
    return { ok: false, reason: input.length === 0 ? "unsupported" : "too_large" };
  }
  try {
    // limitInputPixels : refuse les images piégées qui exploseraient en mémoire une fois décodées.
    const image = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" });
    const { format } = await image.metadata();
    if (!format || !ACCEPTED_FORMATS.has(format)) {
      return { ok: false, reason: "unsupported" };
    }
    const data = await image
      .rotate()
      .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, { fit: "cover", position: "attention" })
      .webp({ quality: 80 })
      .toBuffer();
    return { ok: true, data };
  } catch {
    return { ok: false, reason: "unsupported" };
  }
}
