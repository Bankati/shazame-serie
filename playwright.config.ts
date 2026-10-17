import { defineConfig, devices } from "@playwright/test";

// Parcours navigateur (U12) contre le build de production local (`npm run build:e2e` d'abord : faux TMDB).
// IA, TMDB et quota sont simulés par interception réseau dans chaque test : aucun service payant appelé.
const PORT = 3200;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // Chrome installé sur le poste et sur les runners GitHub : pas de navigateur à télécharger.
    { name: "mobile-chrome", use: { ...devices["Pixel 7"], channel: "chrome" } },
  ],
  webServer: [
    // Faux TMDB (accueil, fiches) : l'accueil est généré au build avec lui (npm run build:e2e).
    {
      command: "node scripts/tmdb-mock.mjs",
      url: "http://127.0.0.1:3299/health",
      reuseExistingServer: true,
      timeout: 10_000,
    },
    {
      command: `npx next start -p ${PORT}`,
      // Aucun service payant ni partagé pendant les tests, même si .env.local en contient : les variables du
      // processus l'emportent sur .env.local. Quotas et limitation de débit passent en mémoire, TMDB est simulé.
      env: {
        UPSTASH_REDIS_REST_URL: "",
        UPSTASH_REDIS_REST_TOKEN: "",
        OPENAI_API_KEY: "",
        TMDB_API_TOKEN: "eyJtb2NrIjp0cnVlfQ.eyJlMmUiOnRydWV9.c2lnbmF0dXJl",
        TMDB_API_BASE_URL: "http://127.0.0.1:3299/3",
      },
      url: `http://localhost:${PORT}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
});
