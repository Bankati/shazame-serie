import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U38 : vitrine → identification → résultat ; navigation de l'application sur mobile.
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));
const RESET_AT = "2026-07-14T22:00:00.000Z";
const MATRIX = { tmdbId: 603, mediaType: "movie", title: "Matrix", year: 1999, posterPath: "/matrix.jpg", confidence: 94 };
const TIKTOK = "https://www.tiktok.com/@cinephile/video/7300000000000000001";

async function simulateServer(page: Page) {
  const links: unknown[] = [];
  await page.route("**/api/quota", (route) => route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: RESET_AT } } }));
  await page.route("**/api/identify/link", async (route) => {
    links.push(route.request().postDataJSON());
    await route.fulfill({
      json: { ok: true, data: { decision: "show", source: "ai", main: MATRIX, alternatives: [], quota: { limit: 3, remaining: 2, resetAt: RESET_AT } } },
    });
  });
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.route(/posthog/, (route) => route.abort());
  return links;
}

test("vitrine : lien collé → application, identifié une seule fois, adresse nettoyée", async ({ page }) => {
  const links = await simulateServer(page);
  // Page chargée et hydratée avant d'agir : un seul clic, puis on attend la nouvelle adresse (recliquer pendant une
  // navigation en cours la perturbait sur un poste chargé).
  await page.goto("/", { waitUntil: "networkidle" });

  await page.getByLabel("Lien de la publication YouTube ou TikTok").fill(TIKTOK);
  await page.getByRole("button", { name: "Identifier", exact: true }).click();
  await page.waitForURL(/\/identifier/, { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: "Matrix" })).toBeVisible({ timeout: 30_000 });
  expect(links).toEqual([{ url: TIKTOK }]);
  // Le lien est retiré de l'adresse : recharger la page ne relance pas l'identification.
  await expect(page).toHaveURL(/\/identifier$/);
});

test("vitrine : « Décrire la scène » ouvre l'application sur l'onglet Description", async ({ page }) => {
  await simulateServer(page);
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Décrire la scène" }).first().click();
  await page.waitForURL(/\/identifier\?mode=description/, { timeout: 20_000 });
  await expect(page.getByRole("tab", { name: "Description" })).toHaveAttribute("aria-selected", "true", { timeout: 15_000 });
  await expect(page.getByLabel("Décrire le film ou la série")).toBeVisible();
});

test("application sur mobile : barre d'onglets en bas, page active signalée, visiteur invité à se connecter", async ({ page }) => {
  await simulateServer(page);
  await page.goto("/identifier");

  const tabs = page.getByRole("navigation", { name: "Navigation principale" });
  await expect(tabs).toBeVisible();
  await expect(tabs.getByRole("link", { name: "Identifier" })).toHaveAttribute("aria-current", "page");
  await expect(tabs.getByRole("link", { name: "Connexion" })).toHaveAttribute("href", "/connexion?suite=%2Fidentifier");
  // Visiteur : invitation à se connecter à la place des identifications récentes.
  // Rangée chargée en différé (Suspense) : un peu plus de marge quand le poste est chargé.
  await expect(page.getByText("Connectez-vous pour retrouver ici vos dernières identifications.")).toBeVisible({ timeout: 15_000 });

  await tabs.getByRole("link", { name: "Historique" }).click();
  // Historique réservé aux comptes : la connexion ramène ensuite à l'historique.
  await expect(page).toHaveURL(/\/connexion\?suite=(%2F|\/)historique/, { timeout: 15_000 });
});
