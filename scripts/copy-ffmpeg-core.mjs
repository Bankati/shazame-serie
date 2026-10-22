// Copie ffmpeg.wasm (lecture de secours des vidéos, U33, AD-40) dans public/ffmpeg/ pour qu'il soit servi par
// le site, sans CDN tiers : le cœur (`@ffmpeg/core`) et `@ffmpeg/ffmpeg` (classe et worker), servis tels quels
// car Turbopack réécrit l'`import()` dynamique du cœur et refuse la création dynamique du worker. Lancé par `postinstall` ;
// le dossier est ignoré par git. Les chemins portent la version : mis en cache une fois pour toutes.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const COPIES = [
  { pkg: "core", prefix: "core", files: ["ffmpeg-core.js", "ffmpeg-core.wasm"] },
  // Classe FFmpeg et son worker, servis tels quels : Turbopack (Next 16.4) refuse d'empaqueter la création du
  // worker, dont l'adresse est dynamique. Le navigateur les charge à la demande (ffmpeg-source.ts).
  { pkg: "ffmpeg", prefix: "worker", files: ["index.js", "classes.js", "types.js", "utils.js", "worker.js", "const.js", "errors.js"] },
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
