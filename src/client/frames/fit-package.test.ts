import { describe, expect, it, vi } from "vitest";

import { PACKAGE_MAX_BYTES } from "@/shared/frames/constants";

import { fitPackage, totalSize } from "./fit-package";

const KB = 1024;

function blobs(...sizes: number[]): Blob[] {
  return sizes.map((size) => new Blob([new Uint8Array(size)], { type: "image/jpeg" }));
}

describe("fitPackage", () => {
  it("garde la première qualité quand le paquet tient déjà", async () => {
    const encodeAt = vi.fn(async () => blobs(200 * KB, 200 * KB, 200 * KB));
    const result = await fitPackage(encodeAt);
    expect(encodeAt).toHaveBeenCalledTimes(1);
    expect(encodeAt).toHaveBeenCalledWith(0.8);
    expect(result).toHaveLength(3);
  });

  it("baisse la qualité par paliers jusqu'à tenir dans 1,5 Mo", async () => {
    const sizes: Record<number, number> = { 0.8: 400 * KB, 0.7: 350 * KB, 0.6: 250 * KB };
    const encodeAt = vi.fn(async (quality: number) => blobs(...Array.from({ length: 5 }, () => sizes[quality] ?? 0)));
    const result = await fitPackage(encodeAt);
    expect(encodeAt.mock.calls.map(([quality]) => quality)).toEqual([0.8, 0.7, 0.6]);
    expect(totalSize(result)).toBeLessThanOrEqual(PACKAGE_MAX_BYTES);
    expect(result).toHaveLength(5);
  });

  it("retire les dernières images en dernier recours, sans descendre sous 2", async () => {
    const result = await fitPackage(async () => blobs(500 * KB, 500 * KB, 500 * KB, 500 * KB));
    expect(result).toHaveLength(3);
    expect(totalSize(result)).toBeLessThanOrEqual(PACKAGE_MAX_BYTES);
  });

  it("renvoie un paquet vide si même 2 images dépassent 1,5 Mo", async () => {
    expect(await fitPackage(async () => blobs(900 * KB, 900 * KB, 900 * KB))).toEqual([]);
  });
});
