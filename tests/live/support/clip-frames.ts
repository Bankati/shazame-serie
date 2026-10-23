import { spawn } from "node:child_process";
import { createRequire } from "node:module";

import sharp from "sharp";

import { dHash, laplacianVariance, meanLuminance, toGrayscale } from "@/shared/frames/analysis";
import {
  ANALYSIS_WIDTH_PX,
  DHASH_HEIGHT_PX,
  DHASH_WIDTH_PX,
  FRAME_MAX_SIZE_PX,
  JPEG_QUALITY_STEPS,
  PACKAGE_MAX_BYTES,
} from "@/shared/frames/constants";
import { excerptWindow, sampleExcerpt } from "@/shared/frames/sampling";
import { judgeFrames } from "@/shared/frames/selection";

// Extraction des images d'un extrait pour l'eval (U13), au plus près du navigateur (src/client/frames) : mêmes
// instants, même analyse de qualité, même taille maximale, même plafond du paquet. ffmpeg-static est installé à
// la demande (`npm install --no-save ffmpeg-static@5.3.0`, library-docs.md).

function ffmpegPath(): string {
  const path = createRequire(import.meta.url)("ffmpeg-static") as string | null;
  if (!path) throw new Error("ffmpeg-static absent : npm install --no-save ffmpeg-static@5.3.0");
  return path;
}

function run(args: string[]): Promise<{ stdout: Buffer; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath(), args, { windowsHide: true });
    const chunks: Buffer[] = [];
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ stdout: Buffer.concat(chunks), stderr, code }));
  });
}

async function durationOf(file: string): Promise<number> {
  const { stderr } = await run(["-hide_banner", "-i", file]);
  const match = /Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/.exec(stderr);
  if (!match) throw new Error(`durée illisible : ${file}`);
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

async function frameAt(file: string, seconds: number): Promise<Buffer> {
  const { stdout, code } = await run([
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(seconds),
    "-i",
    file,
    "-frames:v",
    "1",
    "-f",
    "image2pipe",
    "-vcodec",
    "png",
    "pipe:1",
  ]);
  if (code !== 0 || stdout.length === 0) throw new Error(`image illisible à ${seconds} s : ${file}`);
  return stdout;
}

async function gray(image: Buffer, width: number, height: number) {
  const { data, info } = await sharp(image)
    .resize(width, height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return toGrayscale(data, info.width, info.height);
}

async function metricsOf(image: Buffer) {
  const { width = 1, height = 1 } = await sharp(image).metadata();
  const scale = Math.min(1, ANALYSIS_WIDTH_PX / Math.max(width, height));
  const analysis = await gray(image, Math.max(1, Math.round(width * scale)), Math.max(1, Math.round(height * scale)));
  return {
    meanLuminance: meanLuminance(analysis),
    sharpness: laplacianVariance(analysis),
    hash: dHash(await gray(image, DHASH_WIDTH_PX, DHASH_HEIGHT_PX)),
  };
}

/** Images envoyées au serveur pour cet extrait (0 à 5), comme le ferait le navigateur. */
export async function extractClipFrames(file: string, startS?: number): Promise<Buffer[]> {
  const duration = await durationOf(file);
  const timestamps = sampleExcerpt(excerptWindow(duration, startS));
  const frames = await Promise.all(timestamps.map((seconds) => frameAt(file, seconds)));
  const verdicts = judgeFrames(await Promise.all(frames.map(metricsOf)));
  const kept = frames.filter((_, index) => verdicts[index]?.kept);

  for (const quality of JPEG_QUALITY_STEPS) {
    const jpegs = await Promise.all(
      kept.map((frame) =>
        sharp(frame)
          .resize(FRAME_MAX_SIZE_PX, FRAME_MAX_SIZE_PX, { fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: Math.round(quality * 100) })
          .toBuffer(),
      ),
    );
    if (jpegs.reduce((sum, jpeg) => sum + jpeg.length, 0) <= PACKAGE_MAX_BYTES) return jpegs;
  }
  return [];
}
