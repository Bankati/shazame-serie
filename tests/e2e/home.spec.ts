import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

// Accueil animé (refonte sombre) avec le faux TMDB (scripts/tmdb-mock.mjs, titres fictifs) : la vedette et
// les rangées s'affichent, la zone d'envoi reste au premier écran sur mobile, aucune erreur navigateur.
// Une erreur dans un décor faisait auparavant tomber toute la page (review du 17 octobre 2026).
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));

test.beforeEach(async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: "2026-10-17T22:00:00.000Z" } } }),
  );
});

test("vedette, rangées et genres ; zone d'envoi au premier écran ; aucune erreur", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  // Zone d'envoi visible sans défiler (ui-context.md), au-dessus de la vedette sur mobile.
  const upload = page.getByRole("button", { name: "Choisir un clip" }).first();
  await expect(upload).toBeVisible();
  const box = await upload.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport && box.y + box.height <= viewport.height).toBe(true);

  // Vedette : premier titre en tendance (films et séries en alternance).
  await expect(page.getByRole("heading", { level: 2, name: "Orbite Silencieuse" })).toBeVisible();
  await page.getByRole("button", { name: "Titre suivant" }).click();
  await expect(page.getByRole("heading", { level: 2, name: "Les Gardiens du Port" })).toBeVisible();

  // Rangées d'affiches, chacune liée à la fiche du titre.
  const trending = page.getByRole("region", { name: "Films en tendance" });
  await trending.scrollIntoViewIfNeeded();
  await expect(trending.getByRole("link", { name: /Le Dernier Quai/ })).toHaveAttribute("href", /^\/titre\/film\/9002-/);
  await expect(page.getByRole("region", { name: "Séries en tendance" }).getByText("Signal Perdu")).toBeVisible();

  // Genres : le filtre change la liste affichée.
  const genres = page.getByRole("region", { name: "Explorer par genre" });
  await genres.scrollIntoViewIfNeeded();
  await genres.getByRole("button", { name: /^Drame/ }).click();
  await expect(genres.getByRole("heading", { name: "Films : Drame" })).toBeVisible();
  await expect(genres.getByRole("link", { name: /Le Dernier Quai/ })).toBeVisible();
  await expect(genres.getByRole("link", { name: /Station Kepler/ })).toHaveCount(0);

  expect(errors).toEqual([]);
});
