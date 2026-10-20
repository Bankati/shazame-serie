// Copie ffmpeg.wasm (lecture de secours des vidéos, U33, AD-40) dans public/ffmpeg/ pour qu'il soit servi par
// le site, sans CDN tiers : le cœur (`@ffmpeg/core`) et le worker de `@ffmpeg/ffmpeg`, servi tel quel car
// Turbopack réécrit son `import()` dynamique du cœur (« expression is too dynamic »). Lancé par `postinstall` ;
// le dossier est ignoré par git. Les chemins portent la version : mis en cache une fois pour toutes.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const COPIES = [
  { pkg: "core", prefix: "core", files: ["ffmpeg-core.js", "ffmpeg-core.wasm"] },
  { pkg: "ffmpeg", prefix: "worker", files: ["worker.js", "const.js", "errors.js"] },
];

for (const { pkg, prefix, files } of COPIES) {
  const dir = path.join(root, "node_modules", "@ffmpeg", pkg);
  if (!existsSync(dir)) {
    console.warn(`copy-ffmpeg-core : @ffmpeg/${pkg} absent, copie ignorée.`);
    continue;
  }
  const { version } = JSON.parse(readFileSync(path.join(dir, "package.json"), "utf8"));
  const target = path.join(root, "public", "ffmpeg", `${prefix}-${version}`);
  mkdirSync(target, { recursive: true });
  for (const name of files) {
    copyFileSync(path.join(dir, "dist", "esm", name), path.join(target, name));
  }
  console.log(`copy-ffmpeg-core : @ffmpeg/${pkg} ${version} → public/ffmpeg/${prefix}-${version}/`);
}
