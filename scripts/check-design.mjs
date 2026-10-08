#!/usr/bin/env node
// Contrôle du design system (code-standards.md, section Styling) : aucune couleur en dur et aucune
// valeur arbitraire de couleur, rayon, taille de texte ou espacement hors de src/app/globals.css.
// Exclus : src/components/ui/* (généré par shadcn, protégé). Les proportions (aspect-[2/3]) restent permises.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SRC = join(ROOT, "src");
const EXCLUDED_DIRS = [join(SRC, "components", "ui")];
const EXTENSIONS = [".ts", ".tsx", ".css"];
const ALLOWED_FILES = [join(SRC, "app", "globals.css")];

const RULES = [
  { name: "couleur hexadécimale", pattern: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g },
  { name: "fonction de couleur", pattern: /\b(?:rgba?|hsla?|oklch|oklab|color-mix)\(/g },
  {
    name: "valeur arbitraire interdite",
    pattern:
      /(?<![\w-])(?:bg|text|border(?:-[xytrbl])?|ring|outline|fill|stroke|from|via|to|shadow|decoration|rounded(?:-[a-z]{1,2})?|p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy]|leading|tracking)-\[/g,
  },
];

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(path)) yield* walk(path);
    } else if (EXTENSIONS.some((ext) => entry.name.endsWith(ext)) && !ALLOWED_FILES.includes(path)) {
      yield path;
    }
  }
}

const violations = [];
for (const file of walk(SRC)) {
  if (file.endsWith(".test.ts") || file.endsWith(".test.tsx")) continue;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const rule of RULES) {
      for (const match of line.matchAll(rule.pattern)) {
        violations.push(`${relative(ROOT, file).split(sep).join("/")}:${index + 1} — ${rule.name} : ${match[0]}`);
      }
    }
  });
}

if (violations.length > 0) {
  console.error(`Design system : ${violations.length} écart(s) détecté(s)\n${violations.join("\n")}`);
  process.exit(1);
}
console.log("Design system : aucune couleur en dur ni valeur arbitraire interdite.");
