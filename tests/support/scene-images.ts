import sharp from "sharp";

// Images de test synthétiques : une « scène » = dégradé + rectangles placés par un générateur pseudo-aléatoire
// déterministe. Deux graines différentes donnent deux scènes sans rapport, comme deux plans de film distincts.

const WIDTH = 640;
const HEIGHT = 360;

function random(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 2 ** 32;
  };
}

export async function sceneJpeg(seed: number, quality = 90): Promise<Buffer> {
  const next = random(seed);
  const pixels = Buffer.alloc(WIDTH * HEIGHT * 3);
  const base = [next() * 255, next() * 255, next() * 255];
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const offset = (y * WIDTH + x) * 3;
      pixels[offset] = (base[0]! + x / 4) % 256;
      pixels[offset + 1] = (base[1]! + y / 3) % 256;
      pixels[offset + 2] = base[2]!;
    }
  }
  for (let rectangle = 0; rectangle < 12; rectangle++) {
    const x0 = Math.floor(next() * WIDTH);
    const y0 = Math.floor(next() * HEIGHT);
    const width = 40 + Math.floor(next() * 200);
    const height = 30 + Math.floor(next() * 150);
    const color = [next() * 255, next() * 255, next() * 255];
    for (let y = y0; y < Math.min(HEIGHT, y0 + height); y++) {
      for (let x = x0; x < Math.min(WIDTH, x0 + width); x++) {
        const offset = (y * WIDTH + x) * 3;
        pixels[offset] = color[0]!;
        pixels[offset + 1] = color[1]!;
        pixels[offset + 2] = color[2]!;
      }
    }
  }
  return sharp(pixels, { raw: { width: WIDTH, height: HEIGHT, channels: 3 } }).jpeg({ quality }).toBuffer();
}

/** Même image, réencodée comme le ferait une application de partage : plus petite et plus compressée. */
export function recompress(image: Buffer): Promise<Buffer> {
  return sharp(image).resize(560).jpeg({ quality: 55 }).toBuffer();
}

/** Un « clip » = plusieurs scènes consécutives. */
export function clipJpegs(firstSeed: number, count = 4): Promise<Buffer[]> {
  return Promise.all(Array.from({ length: count }, (_, index) => sceneJpeg(firstSeed + index)));
}
