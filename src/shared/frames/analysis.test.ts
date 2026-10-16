import { describe, expect, it } from "vitest";

import { dHash, type GrayImage, hammingDistance, laplacianVariance, meanLuminance, toGrayscale } from "./analysis";

function gray(width: number, height: number, pixel: (x: number, y: number) => number): GrayImage {
  const data = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data[y * width + x] = pixel(x, y);
    }
  }
  return { width, height, data };
}

describe("toGrayscale", () => {
  it("applique la luminance BT.601 et ignore l'alpha", () => {
    const rgba = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 0, 0, 0, 255, 128, 255, 255, 255, 255]);
    expect([...toGrayscale(rgba, 2, 2).data]).toEqual([76, 150, 29, 255]);
  });
});

describe("meanLuminance", () => {
  it("renvoie la moyenne des pixels", () => {
    expect(meanLuminance(gray(4, 4, (x) => (x < 2 ? 0 : 200)))).toBe(100);
  });

  it("vaut 0 pour une image vide", () => {
    expect(meanLuminance({ width: 0, height: 0, data: new Uint8Array() })).toBe(0);
  });
});

describe("laplacianVariance", () => {
  it("est nulle pour une image unie (aucun contour)", () => {
    expect(laplacianVariance(gray(20, 20, () => 128))).toBe(0);
  });

  it("est élevée pour un damier (beaucoup de contours)", () => {
    expect(laplacianVariance(gray(20, 20, (x, y) => ((x + y) % 2 === 0 ? 0 : 255)))).toBeGreaterThan(10_000);
  });

  it("est faible pour un dégradé doux (image floue)", () => {
    expect(laplacianVariance(gray(40, 40, (x) => x * 3))).toBeLessThan(1);
  });
});

describe("dHash", () => {
  it("met tous les bits à 1 quand chaque pixel est plus clair que son voisin de droite", () => {
    expect(dHash(gray(9, 8, (x) => 255 - x * 20))).toBe(0xffff_ffff_ffff_ffffn);
  });

  it("met tous les bits à 0 pour un dégradé croissant", () => {
    expect(dHash(gray(9, 8, (x) => x * 20))).toBe(0n);
  });

  it("refuse une image qui n'est pas en 9 × 8", () => {
    expect(() => dHash(gray(8, 8, () => 0))).toThrow(/9 × 8/);
  });
});

describe("hammingDistance", () => {
  it.each([
    [0n, 0n, 0],
    [0b1011n, 0b0001n, 2],
    [0n, 0xffff_ffff_ffff_ffffn, 64],
  ])("distance(%s, %s) = %s", (a, b, expected) => {
    expect(hammingDistance(a, b)).toBe(expected);
  });
});
