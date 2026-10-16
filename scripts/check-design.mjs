#!/usr/bin/env node
// Contrôle du design system : aucune couleur en dur et aucune valeur arbitraire de couleur, rayon,
// taille de texte ou espacement hors de src/app/globals.css (règles : scripts/design-rules.mjs).
// Exclus : src/components/ui/* (généré par shadcn, protégé) et les fichiers de test.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { findDesignViolations } from "./design-rules.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const EXCLUDED_DIRS = [join(SRC, "components", "ui")];
const EXTENSIONS = [".ts", ".tsx", ".css"];
const ALLOWED_FILES = [join(SRC, "app", "globals.css")];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(path)) yield* walk(path);
    } else if (
      EXTENSIONS.some((ext) => entry.name.endsWith(ext)) &&
      !/\.test\.tsx?$/.test(entry.name) &&
      !ALLOWED_FILES.includes(path)
    ) {
      yield path;
    }
  }
}

const violations = [];
for (const file of walk(SRC)) {
  const name = relative(ROOT, file).split(sep).join("/");
  for (const v of findDesignViolations(readFileSync(file, "utf8"))) {
    violations.push(`${name}:${v.line} — ${v.rule} : ${v.match}`);
  }
}

if (violations.length > 0) {
  console.error(`Design system : ${violations.length} écart(s) détecté(s)\n${violations.join("\n")}`);
  process.exit(1);
}
console.log("Design system : aucune couleur en dur ni valeur arbitraire interdite.");
