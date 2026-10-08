// Règles du contrôle de design system (code-standards.md, section Styling), séparées du parcours
// des fichiers pour être testées (scripts/design-rules.test.mjs).

export const DESIGN_RULES = [
  {
    name: "couleur hexadécimale",
    pattern: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![0-9a-zA-Z_-])/g,
  },
  { name: "fonction de couleur", pattern: /\b(?:rgba?|hsla?|oklch|oklab|color-mix)\(/g },
  {
    // Couleur, rayon, texte, espacement arbitraires. Les proportions (aspect-[2/3]) et largeurs restent permises.
    name: "valeur arbitraire interdite",
    pattern:
      /(?<![\w-])(?:bg|text|border(?:-[xytrbl])?|ring|outline|fill|stroke|from|via|to|shadow|decoration|rounded(?:-[a-z]{1,2})?|p[xytrbl]?|m[xytrbl]?|gap(?:-[xy])?|space-[xy]|leading|tracking)-\[/g,
  },
];

/** Renvoie les écarts d'un contenu, ligne par ligne. */
export function findDesignViolations(content) {
  const violations = [];
  content.split("\n").forEach((line, index) => {
    for (const rule of DESIGN_RULES) {
      for (const match of line.matchAll(rule.pattern)) {
        violations.push({ line: index + 1, rule: rule.name, match: match[0] });
      }
    }
  });
  return violations;
}
