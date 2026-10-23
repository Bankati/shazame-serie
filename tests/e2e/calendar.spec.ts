import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

// Critère de fin de U42 : calendrier → fiche. Sorties fictives servies par le faux TMDB (scripts/tmdb-mock.mjs).
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));

test.beforeEach(async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
});

test("films à venir groupés par mois, dans l'ordre des dates, puis la fiche", async ({ page }) => {
  // Sans attendre le repos du réseau : l'état de « Ma liste » se charge à part (et attend la base en local).
  await page.goto("/calendrier");

  await expect(page.getByRole("heading", { level: 1, name: "Calendrier des sorties" })).toBeVisible();
  const months = page.getByRole("heading", { level: 2 });
  await expect(months).toHaveText(["Novembre 2026", "Décembre 2026"]);
  await expect(page.getByText("Sortie le 4 novembre 2026")).toBeVisible();
  await expect(page.getByText("Dates et informations fournies par TMDB, pour la France.")).toBeVisible();

  await page.getByRole("link", { name: "Voir la fiche de Nuit Polaire" }).click();
  await page.waitForURL(/\/titre\/film\/9302-nuit-polaire/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Nuit Polaire" })).toBeVisible();
});

test("onglet séries en diffusion, accessible depuis la barre d'onglets", async ({ page }) => {
  await page.goto("/identifier");
  await page
    .getByRole("navigation", { name: "Navigation principale" })
    .getByRole("link", { name: "Calendrier" })
    .click();
  await page.waitForURL(/\/calendrier$/, { timeout: 15_000 });

  await page.getByRole("link", { name: "Séries en diffusion" }).click();
  await page.waitForURL(/onglet=series/, { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Séries en diffusion" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("heading", { level: 3, name: "Les Veilleurs du Quai" })).toBeVisible();
  await expect(page.getByText("Première diffusion le 1 septembre 2026")).toBeVisible();
});
