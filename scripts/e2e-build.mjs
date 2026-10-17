#!/usr/bin/env node
// Build des tests navigateur : l'accueil est généré au build (ISR), il faut donc que le faux serveur TMDB
// réponde pendant `next build`. Lance le faux serveur, construit avec ses variables, puis l'arrête.
// Les autres variables (Supabase local en CI) sont transmises telles quelles.
import { spawn } from "node:child_process";

import { startTmdbMock, TMDB_MOCK_BASE_URL, TMDB_MOCK_TOKEN } from "./tmdb-mock.mjs";

const server = await startTmdbMock();
const code = await new Promise((resolve) => {
  const build = spawn("npx", ["next", "build"], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: {
      ...process.env,
      TMDB_API_TOKEN: TMDB_MOCK_TOKEN,
      TMDB_API_BASE_URL: TMDB_MOCK_BASE_URL,
      // Aucun service payant ou partagé dans le build des tests (comme playwright.config.ts).
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
      OPENAI_API_KEY: "",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  });
  build.on("exit", (status) => resolve(status ?? 1));
});
server.close();
process.exit(code);
