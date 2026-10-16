import { defineConfig, devices } from "@playwright/test";

// Parcours navigateur (U12) contre le build de production local (`npm run build` d'abord).
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
  webServer: {
    command: `npx next start -p ${PORT}`,
    // Aucun service payant ni partagé pendant les tests, même si .env.local en contient : les variables du
    // processus l'emportent sur .env.local. Quotas et limitation de débit passent en mémoire.
    env: { UPSTASH_REDIS_REST_URL: "", UPSTASH_REDIS_REST_TOKEN: "", OPENAI_API_KEY: "", TMDB_API_TOKEN: "" },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
