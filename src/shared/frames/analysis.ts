// Mesures de qualité sur des pixels, sans dépendance au navigateur : réutilisées par l'eval (Node)
// et, pour le dHash, par le serveur (U10) afin que les deux côtés calculent la même empreinte.

/** Image en niveaux de gris : une valeur de 0 à 255 par pixel, ligne par ligne. */
export type GrayImage = {
  width: number;
  height: number;
  data: Uint8Array;
};

/** Convertit des pixels RGBA (ImageData) en niveaux de gris (luminance BT.601). */
export function toGrayscale(rgba: Uint8ClampedArray | Uint8Array, width: number, height: number): GrayImage {
  const data = new Uint8Array(width * height);
  for (let pixel = 0; pixel < data.length; pixel++) {
    const offset = pixel * 4;
    data[pixel] = Math.round(0.299 * (rgba[offset] ?? 0) + 0.587 * (rgba[offset + 1] ?? 0) + 0.114 * (rgba[offset + 2] ?? 0));
  }
  return { width, height, data };
}

export function meanLuminance(image: GrayImage): number {
  if (image.data.length === 0) {
    return 0;
  }
  let sum = 0;
  for (const value of image.data) {
    sum += value;
  }
  return sum / image.data.length;
}

/**
 * Netteté : variance du laplacien (voisinage à 4 pixels). Une image floue a peu de contours,
 * donc une variance faible. Les bords de l'image sont ignorés.
 */
export function laplacianVariance(image: GrayImage): number {
  const { width, height, data } = image;
  if (width < 3 || height < 3) {
    return 0;
  }

  let sum = 0;
  let sumOfSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const index = y * width + x;
      const laplacian =
        (data[index - width] ?? 0) + (data[index + width] ?? 0) + (data[index - 1] ?? 0) + (data[index + 1] ?? 0) - 4 * (data[index] ?? 0);
      sum += laplacian;
      sumOfSquares += laplacian * laplacian;
      count++;
    }
  }
  const mean = sum / count;
  return sumOfSquares / count - mean * mean;
}

/**
 * dHash 64 bits d'une image déjà réduite à 9 × 8 pixels : pour chaque ligne, un bit par paire
 * de pixels voisins, à 1 quand le pixel de gauche est plus clair que celui de droite.
 */
export function dHash(image: GrayImage): bigint {
  if (image.width !== 9 || image.height !== 8) {
    throw new Error(`dHash attend une image de 9 × 8 pixels (reçu ${image.width} × ${image.height}).`);
  }
  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const left = image.data[y * 9 + x] ?? 0;
      const right = image.data[y * 9 + x + 1] ?? 0;
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
}

/** Nombre de bits différents entre deux empreintes de 64 bits. */
export function hammingDistance(a: bigint, b: bigint): number {
  let difference = BigInt.asUintN(64, a ^ b);
  let count = 0;
  while (difference > 0n) {
    count += Number(difference & 1n);
    difference >>= 1n;
  }
  return count;
}
