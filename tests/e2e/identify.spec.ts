import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U12 : parcours clip → résultat, avec IA simulée. La vidéo de test est une fractale
// générée (aucun contenu protégé) ; l'extraction des images est réelle, seul le serveur est simulé.
const CLIP = path.join(__dirname, "fixtures", "clip.mp4");
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));
const RESET_AT = "2026-07-14T22:00:00.000Z";

const MATRIX = { tmdbId: 603, mediaType: "movie", title: "Matrix", year: 1999, posterPath: "/matrix.jpg", confidence: 94 };
const ALIEN = { tmdbId: 348, mediaType: "movie", title: "Alien", year: 1979, posterPath: "/alien.jpg", confidence: 40 };

async function simulateServer(page: Page, identify: { status: number; body: unknown }) {
  const frameCounts: number[] = [];
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: RESET_AT } } }),
  );
  await page.route("**/api/identify", async (route) => {
    const body = route.request().postDataBuffer()?.toString("latin1") ?? "";
    frameCounts.push((body.match(/name="frames"/g) ?? []).length);
    await route.fulfill({ status: identify.status, json: identify.body });
  });
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.route(/posthog/, (route) => route.abort());
  return frameCounts;
}

async function chooseClip(page: Page) {
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(CLIP);
}

test("clip → résultat sûr : affiche, titre, « Très probable », compteur mis à jour", async ({ page }) => {
  const frameCounts = await simulateServer(page, {
    status: 200,
    body: { ok: true, data: { decision: "show", source: "ai", main: MATRIX, alternatives: [], quota: { limit: 3, remaining: 2, resetAt: RESET_AT } } },
  });

  await chooseClip(page);

  await expect(page.getByRole("heading", { name: "Matrix" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Très probable, 94 %")).toBeVisible();
  await expect(page.getByRole("img", { name: "Affiche de Matrix (1999)" })).toBeVisible();
  await expect(page.getByText("1999, Film")).toBeVisible();
  await expect(page.getByText("2 restantes")).toBeVisible();
  // Le serveur n'a reçu que des images, 2 à 5 (invariant 1).
  expect(frameCounts[0]).toBeGreaterThanOrEqual(2);
  expect(frameCounts[0]).toBeLessThanOrEqual(5);
});

test("résultat probable : une alternative cliquée passe en résultat principal", async ({ page }) => {
  await simulateServer(page, {
    status: 200,
    body: {
      ok: true,
      data: {
        decision: "show_with_alternatives",
        source: "ai",
        main: { ...MATRIX, confidence: 65 },
        alternatives: [ALIEN],
        quota: { limit: 3, remaining: 2, resetAt: RESET_AT },
      },
    },
  });

  await chooseClip(page);
  await expect(page.getByText("Probable, 65 %")).toBeVisible({ timeout: 30_000 });

  await page.getByRole("button", { name: "Afficher Alien (1979) comme résultat" }).click();

  await expect(page.getByRole("heading", { name: "Alien" })).toBeVisible();
  await expect(page.getByText("Piste possible, 40 %")).toBeVisible();
  await expect(page.getByRole("button", { name: "Afficher Matrix (1999) comme résultat" })).toBeVisible();
});

test("quota épuisé : message clair, aucun résultat", async ({ page }) => {
  await simulateServer(page, {
    status: 429,
    body: {
      ok: false,
      error: { code: "QUOTA_EXCEEDED", message: "…", details: { quota: { limit: 3, remaining: 0, resetAt: RESET_AT } } },
    },
  });

  await chooseClip(page);

  await expect(page.getByText(/limite d'identifications pour aujourd'hui/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("0 restante")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Matrix" })).toHaveCount(0);
});
