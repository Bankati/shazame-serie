import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { FFMPEG_CORE_VERSION, FFMPEG_WORKER_VERSION } from "./ffmpeg-source";

// Les chemins de public/ffmpeg/ portent la version installée (scripts/copy-ffmpeg-core.mjs) : une mise à jour
// des paquets sans mise à jour des constantes casserait la lecture de secours en production.
function installedVersion(pkg: string): string {
  const file = path.join(process.cwd(), "node_modules", "@ffmpeg", pkg, "package.json");
  return (JSON.parse(readFileSync(file, "utf8")) as { version: string }).version;
}

describe("versions de ffmpeg.wasm", () => {
  it("les constantes suivent les paquets installés", () => {
    expect(FFMPEG_CORE_VERSION).toBe(installedVersion("core"));
    expect(FFMPEG_WORKER_VERSION).toBe(installedVersion("ffmpeg"));
  });

  it("le smoke test vérifie les fichiers de ces versions", () => {
    const smoke = readFileSync(path.join(process.cwd(), ".github", "workflows", "smoke.yml"), "utf8");
    expect(smoke).toContain(`ffmpeg/core-${FFMPEG_CORE_VERSION}/ffmpeg-core.wasm`);
    expect(smoke).toContain(`ffmpeg/worker-${FFMPEG_WORKER_VERSION}/worker.js`);
  });
});
