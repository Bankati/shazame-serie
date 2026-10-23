import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

// Accueil (refonte U43, AD-48) avec le faux TMDB (scripts/tmdb-mock.mjs, titres fictifs) : le téléphone de
// démonstration rejoue une identification avec le premier titre en tendance, les étapes et les rangées
// s'affichent, la zone d'envoi reste au premier écran sur mobile, aucune erreur navigateur.
// Une erreur dans un décor faisait auparavant tomber toute la page (review du 17 octobre 2026).
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));

test.beforeEach(async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: "2026-10-17T22:00:00.000Z" } } }),
  );
});

test("hero animé, étapes, rangées et genres ; zone d'envoi au premier écran ; aucune erreur", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");

  // Lanceur d'identification visible sans défiler (U38), au-dessus du téléphone sur mobile.
  const launcher = page.getByLabel("Lien de la publication YouTube ou TikTok");
  await expect(launcher).toBeVisible();
  const box = await launcher.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport && box.y + box.height <= viewport.height).toBe(true);

  // Téléphone de démonstration : décrit pour les lecteurs d'écran, joué avec le premier titre en tendance.
  const demo = page.getByRole("img", { name: "Démonstration : un extrait identifié en quatre étapes" }).first();
  await expect(demo).toBeVisible();
  await expect(page.locator(".demo-phone").first()).toContainText("Orbite Silencieuse");

  // Comment ça marche : les trois étapes, lisibles.
  const steps = page.locator("#comment-ca-marche");
  await steps.scrollIntoViewIfNeeded();
  await expect(steps.getByRole("heading", { level: 3 })).toHaveText(["Montrez-nous l'extrait", "Nous analysons les indices", "Découvrez le titre"]);

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

  // Dernière section : la pellicule montre les images des titres en tendance.
  const finalCta = page.getByRole("region", { name: /Un extrait vous intrigue/ });
  await finalCta.scrollIntoViewIfNeeded();
  await expect(finalCta.getByRole("link", { name: "Identifier un titre" })).toHaveAttribute("href", "/identifier");
  expect(await finalCta.locator("img").count()).toBeGreaterThan(0);

  expect(errors).toEqual([]);
});
