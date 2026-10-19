import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { AVATAR_MAX_UPLOAD_BYTES, AVATAR_SIZE_PX, processAvatar } from "./avatar-image";

async function photo(format: "jpeg" | "png" | "webp", width = 800, height = 500): Promise<Buffer> {
  const image = sharp({ create: { width, height, channels: 3, background: { r: 200, g: 40, b: 40 } } });
  // Métadonnées EXIF (appareil) : elles ne doivent pas survivre au traitement.
  return image.withExif({ IFD0: { Make: "AppareilSecret", Model: "Modele-42" } }).toFormat(format).toBuffer();
}

describe("processAvatar", () => {
  it.each(["jpeg", "png", "webp"] as const)("%s : carré 256 × 256 en WebP, sans EXIF", async (format) => {
    const result = await processAvatar(await photo(format));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const meta = await sharp(result.data).metadata();
    expect(meta).toMatchObject({ format: "webp", width: AVATAR_SIZE_PX, height: AVATAR_SIZE_PX });
    expect(meta.exif).toBeUndefined();
    expect(result.data.includes(Buffer.from("AppareilSecret"))).toBe(false);
  });

  it("refuse un fichier qui n'est pas une image, même nommé .jpg", async () => {
    expect(await processAvatar(Buffer.from("<script>alert(1)</script>"))).toEqual({ ok: false, reason: "unsupported" });
    expect(await processAvatar(Buffer.alloc(0))).toEqual({ ok: false, reason: "unsupported" });
  });

  it("refuse un format non prévu (GIF) et une image de plus de 4 Mo", async () => {
    const gif = await sharp({ create: { width: 10, height: 10, channels: 3, background: "#000" } }).gif().toBuffer();
    expect(await processAvatar(gif)).toEqual({ ok: false, reason: "unsupported" });
    expect(await processAvatar(Buffer.alloc(AVATAR_MAX_UPLOAD_BYTES + 1))).toEqual({ ok: false, reason: "too_large" });
  });
});
