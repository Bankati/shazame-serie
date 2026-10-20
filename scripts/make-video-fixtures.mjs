// Génère les vidéos d'essai de U33 (un fichier par format, HEVC, vidéo longue, gros fichier) dans
// tests/e2e/fixtures/videos/ (ignoré par git). Images de synthèse uniquement (fractale), aucun contenu protégé.
// Usage : npm install --no-save ffmpeg-static@5.3.0, puis npm run fixtures:videos [-- --force]
// ffmpeg-static n'est pas dans package.json : son installation télécharge un binaire depuis GitHub et échoue
// sans réseau, ce qui ferait échouer les builds Vercel. On l'installe à la demande (ici et en CI).
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import ffmpeg from "ffmpeg-static";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "tests", "e2e", "fixtures", "videos");
const force = process.argv.includes("--force");

// Fractale qui zoome : chaque image diffère des autres (pas de doublon) et reste nette.
const fractal = (size, seconds, rate = 25) => ["-f", "lavfi", "-i", `mandelbrot=size=${size}:rate=${rate}`, "-t", String(seconds)];
const h264 = ["-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast"];

const FIXTURES = [
  { name: "h264.mp4", args: [...fractal("640x360", 8), ...h264] },
  { name: "h264.mov", args: [...fractal("640x360", 8), ...h264] },
  { name: "h264.m4v", args: [...fractal("640x360", 8), ...h264, "-f", "mp4"] },
  { name: "h264.mkv", args: [...fractal("640x360", 8), ...h264] },
  { name: "vp9.webm", args: [...fractal("640x360", 8), "-c:v", "libvpx-vp9", "-b:v", "1M", "-deadline", "realtime", "-cpu-used", "8"] },
  { name: "h263.3gp", args: [...fractal("352x288", 8, 15), "-c:v", "h263", "-b:v", "512k"] },
  { name: "mpeg4.avi", args: [...fractal("640x360", 8), "-c:v", "libxvid", "-q:v", "4"] },
  { name: "hevc.mp4", args: [...fractal("640x360", 8), "-c:v", "libx265", "-pix_fmt", "yuv420p", "-tag:v", "hvc1", "-preset", "veryfast", "-x265-params", "log-level=error"] },
  { name: "hevc.mov", args: [...fractal("640x360", 8), "-c:v", "libx265", "-pix_fmt", "yuv420p", "-tag:v", "hvc1", "-preset", "veryfast", "-x265-params", "log-level=error"] },
  // Plus de 60 s : un passage de 60 s est choisi.
  { name: "long-150s.mp4", args: [...fractal("320x180", 150, 10), ...h264] },
  // Plus de 50 Mo (ancienne limite) : bruit fort, donc peu compressible.
  { name: "large-60mb.mp4", args: [...fractal("1280x720", 10), "-vf", "noise=alls=60:allf=t", ...h264, "-b:v", "52M", "-minrate", "52M", "-maxrate", "52M", "-bufsize", "52M"] },
];

mkdirSync(outDir, { recursive: true });
for (const fixture of FIXTURES) {
  const file = path.join(outDir, fixture.name);
  if (existsSync(file) && !force) continue;
  execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", ...fixture.args, "-an", file], { stdio: "inherit" });
  console.log(`${fixture.name} : ${(statSync(file).size / 1024 / 1024).toFixed(1)} Mo`);
}
