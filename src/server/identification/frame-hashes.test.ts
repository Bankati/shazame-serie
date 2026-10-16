import { describe, expect, it } from "vitest";

import { hammingDistance } from "@/shared/frames/analysis";

import { clipJpegs, recompress, sceneJpeg } from "../../../tests/support/scene-images";

import { clipFingerprint, computeFrameHash, toSignedBigint } from "./frame-hashes";

describe("computeFrameHash", () => {
  it("donne la même empreinte pour les mêmes octets", async () => {
    const image = await sceneJpeg(1);
    expect(await computeFrameHash(image)).toBe(await computeFrameHash(image));
  });

  it("reste proche après recompression (≤ 6 bits)", async () => {
    const image = await sceneJpeg(2);
    const distance = hammingDistance(await computeFrameHash(image), await computeFrameHash(await recompress(image)));
    expect(distance).toBeLessThanOrEqual(6);
  });

  it("sépare nettement deux scènes différentes", async () => {
    const [a, b] = await clipJpegs(10, 2);
    const distance = hammingDistance(await computeFrameHash(a!), await computeFrameHash(b!));
    expect(distance).toBeGreaterThan(12);
  });

  it("refuse ce qui n'est pas une image", async () => {
    await expect(computeFrameHash(Buffer.from("pas une image"))).rejects.toThrow();
  });
});

describe("clipFingerprint", () => {
  it("ne dépend pas de l'ordre des images", () => {
    expect(clipFingerprint([3n, 1n, 2n])).toBe(clipFingerprint([1n, 2n, 3n]));
  });

  it("change si une image change", () => {
    expect(clipFingerprint([1n, 2n, 3n])).not.toBe(clipFingerprint([1n, 2n, 4n]));
  });

  it("est un SHA-256 hexadécimal", () => {
    expect(clipFingerprint([0xffff_ffff_ffff_ffffn])).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("toSignedBigint", () => {
  it("convertit un dHash 64 bits non signé vers la plage du bigint PostgreSQL sans perdre de bit", () => {
    const hash = 0xffff_ffff_ffff_fffen;
    const signed = toSignedBigint(hash);
    expect(signed).toBe(-2n);
    expect(BigInt.asUintN(64, signed)).toBe(hash);
  });
});
