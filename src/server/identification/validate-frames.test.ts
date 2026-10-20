import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";

import { frameModeSchema } from "@/schemas/identify";

import { minFrames, validateFrames } from "./validate-frames";

// Invariant 1 et AD-38 : 2 à 5 images pour un clip, 1 à 5 captures en mode image ; 1,5 Mo ; JPEG réel.
let jpeg: File;
let png: File;

beforeAll(async () => {
  const pixels = { create: { width: 64, height: 36, channels: 3 as const, background: "#336699" } };
  jpeg = new File([new Uint8Array(await sharp(pixels).jpeg().toBuffer())], "image.jpg", { type: "image/jpeg" });
  png = new File([new Uint8Array(await sharp(pixels).png().toBuffer())], "image.jpg", { type: "image/jpeg" });
});

describe("validateFrames selon le mode", () => {
  it("clip : 2 à 5 images, une seule refusée", async () => {
    expect(await validateFrames([jpeg], { minCount: minFrames("clip") })).toEqual({ ok: false, reason: "count" });
    expect((await validateFrames([jpeg, jpeg], { minCount: minFrames("clip") })).ok).toBe(true);
  });

  it("images : une seule capture acceptée, 6 refusées", async () => {
    expect((await validateFrames([jpeg], { minCount: minFrames("images") })).ok).toBe(true);
    expect(await validateFrames(Array.from({ length: 6 }, () => jpeg), { minCount: minFrames("images") })).toEqual({ ok: false, reason: "count" });
  });

  it("type réel vérifié : un PNG annoncé JPEG est refusé, même seul en mode image", async () => {
    expect(await validateFrames([png], { minCount: minFrames("images") })).toEqual({ ok: false, reason: "type" });
  });

  it("par défaut (sans mode) : règles du clip", async () => {
    expect(await validateFrames([jpeg])).toEqual({ ok: false, reason: "count" });
  });
});

describe("frameModeSchema", () => {
  it("absent : clip ; inconnu : refusé", () => {
    expect(frameModeSchema.parse(undefined)).toBe("clip");
    expect(frameModeSchema.parse("images")).toBe("images");
    expect(frameModeSchema.safeParse("video").success).toBe(false);
  });
});
