import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U36 : lien → résultat, avec serveur simulé (aucun appel YouTube, TikTok ni IA réel).
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));
const RESET_AT = "2026-07-14T22:00:00.000Z";
const MATRIX = { tmdbId: 603, mediaType: "movie", title: "Matrix", year: 1999, posterPath: "/matrix.jpg", confidence: 94 };
const TIKTOK = "https://www.tiktok.com/@cinephile/video/7300000000000000001";

async function simulateServer(page: Page, identify: { status: number; body: unknown }) {
  const sent: unknown[] = [];
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: RESET_AT } } }),
  );
  await page.route("**/api/identify/link", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: identify.status, json: identify.body });
  });
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.route(/posthog/, (route) => route.abort());
  return sent;
}

async function openLinkTab(page: Page) {
  await page.goto("/identifier");
  const tab = page.getByRole("tab", { name: "Lien" });
  await expect(async () => {
    await tab.click();
    await expect(page.getByLabel("Coller le lien de la publication")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

test("lien TikTok → résultat : titre, confiance, compteur ; lien envoyé une fois", async ({ page }) => {
  const sent = await simulateServer(page, {
    status: 200,
    body: { ok: true, data: { decision: "show", source: "ai", main: MATRIX, alternatives: [], quota: { limit: 3, remaining: 2, resetAt: RESET_AT } } },
  });
  await openLinkTab(page);

  await page.getByLabel("Coller le lien de la publication").fill(TIKTOK);
  await page.getByRole("button", { name: "Identifier" }).click();

  await expect(page.getByRole("heading", { name: "Matrix" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("2 restantes")).toBeVisible();
  expect(sent).toEqual([{ url: TIKTOK }]);
  await expect(page.getByRole("button", { name: "Coller un autre lien" }).first()).toBeVisible();
});

test("lien Instagram : refusé dans le navigateur, message clair, rien n'est envoyé", async ({ page }) => {
  const sent = await simulateServer(page, { status: 200, body: {} });
  await openLinkTab(page);

  const field = page.getByLabel("Coller le lien de la publication");
  await field.fill("https://www.instagram.com/reel/Cabc123/");
  await field.blur();
  await expect(page.getByText("Les liens Instagram ne sont pas encore pris en charge.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Identifier" })).toBeDisabled();
  expect(sent).toHaveLength(0);
});

test("publication sans indice : message qui propose le clip ou une capture", async ({ page }) => {
  await simulateServer(page, { status: 422, body: { ok: false, error: { code: "LINK_NO_CLUES", message: "Sans indice" } } });
  await openLinkTab(page);
  await page.getByLabel("Coller le lien de la publication").fill("https://youtu.be/dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Identifier" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Cette publication ne donne pas assez d'indices." })).toBeVisible({ timeout: 30_000 });
});

test("publication introuvable : message adapté", async ({ page }) => {
  await simulateServer(page, { status: 404, body: { ok: false, error: { code: "LINK_NOT_FOUND", message: "Introuvable" } } });
  await openLinkTab(page);
  await page.getByLabel("Coller le lien de la publication").fill("https://www.youtube.com/shorts/dQw4w9WgXcQ");
  await page.getByRole("button", { name: "Identifier" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Cette publication est introuvable" })).toBeVisible({ timeout: 30_000 });
});
