import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Invariant 2 : le SDK du fournisseur IA n'est importé que dans src/server/ai/.
  {
    ignores: ["src/server/ai/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["openai", "openai/*"], message: "Le SDK OpenAI ne s'importe que dans src/server/ai/ (invariant 2)." },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // ffmpeg.wasm copié depuis node_modules (scripts/copy-ffmpeg-core.mjs) : code tiers.
    "public/ffmpeg/**",
  ]),
]);

export default eslintConfig;
