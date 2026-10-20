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
  await expect(page.getByRole("link", { name: "Voir la fiche" })).toHaveAttribute("href", "/titre/film/603-matrix");
  // Visiteur : « Ajouter à ma liste » mène à la connexion, avec retour sur la page (U18).
  await expect(page.getByRole("link", { name: "Ajouter à ma liste" })).toHaveAttribute("href", "/connexion?suite=%2F");
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

test("signaler une erreur : images envoyées seulement avec le consentement (U20, RG8)", async ({ page }) => {
  const identificationId = "6f1c2a3b-0000-4000-8000-0000000000aa";
  await simulateServer(page, {
    status: 200,
    body: {
      ok: true,
      data: { decision: "show", source: "ai", main: MATRIX, alternatives: [], quota: { limit: 3, remaining: 2, resetAt: RESET_AT }, identificationId },
    },
  });
  await page.route("**/api/catalog/search?*", (route) =>
    route.fulfill({ json: { ok: true, data: { results: [{ tmdbId: 604, mediaType: "movie", title: "Matrix Reloaded", year: 2003, posterPath: "/r.jpg" }] } } }),
  );
  const reports: string[] = [];
  await page.route("**/api/reports", async (route) => {
    reports.push(route.request().postDataBuffer()?.toString("latin1") ?? "");
    await route.fulfill({ status: 201, json: { ok: true, data: { reportId: "6f1c2a3b-0000-4000-8000-0000000000bb", imagesStored: 0 } } });
  });

  await chooseClip(page);
  await page.getByRole("button", { name: "Ce n'est pas le bon titre ?" }).click({ timeout: 30_000 });
  await page.getByLabel(/Quel est le bon titre/).fill("matrix rel");
  await page.getByRole("button", { name: /Matrix Reloaded/ }).click();
  const consent = page.getByRole("checkbox");
  await expect(consent).not.toBeChecked();
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(page.getByText("Votre signalement a bien été envoyé")).toBeVisible();

  // Sans consentement : la correction part, aucune image.
  expect(reports[0]).toContain(identificationId);
  expect(reports[0]).toContain('name="correctedTmdbId"');
  expect(reports[0]).not.toContain('name="frames"');
  // Un seul signalement par résultat : le lien disparaît.
  await expect(page.getByRole("button", { name: "Ce n'est pas le bon titre ?" })).toHaveCount(0);
});

test("signaler avec consentement : les images extraites accompagnent le signalement", async ({ page }) => {
  await simulateServer(page, {
    status: 200,
    body: {
      ok: true,
      data: {
        decision: "show",
        source: "ai",
        main: MATRIX,
        alternatives: [],
        quota: { limit: 3, remaining: 2, resetAt: RESET_AT },
        identificationId: "6f1c2a3b-0000-4000-8000-0000000000cc",
      },
    },
  });
  const reports: string[] = [];
  await page.route("**/api/reports", async (route) => {
    reports.push(route.request().postDataBuffer()?.toString("latin1") ?? "");
    await route.fulfill({ status: 201, json: { ok: true, data: { reportId: "6f1c2a3b-0000-4000-8000-0000000000dd", imagesStored: 3 } } });
  });

  await chooseClip(page);
  await page.getByRole("button", { name: "Ce n'est pas le bon titre ?" }).click({ timeout: 30_000 });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect(page.getByText("Votre signalement a bien été envoyé")).toBeVisible();
  const frames = (reports[0]?.match(/name="frames"/g) ?? []).length;
  expect(frames).toBeGreaterThanOrEqual(2);
  expect(frames).toBeLessThanOrEqual(5);
  expect(reports[0]).toContain('name="imagesConsent"\r\n\r\ntrue');
});
