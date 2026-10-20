import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

// Critère de fin de U19 : le lien partagé, ouvert sans compte, affiche la fiche avec son aperçu Open Graph.
// Titre fictif servi par le faux TMDB (scripts/tmdb-mock.mjs).
const TITLE_PATH = "/titre/film/9001-orbite-silencieuse";
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));

test("lien partagé ouvert sans compte : fiche visible et carte d'aperçu 1200 × 630", async ({ page, request }) => {
  const html = await (await request.get(TITLE_PATH)).text();
  const image = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1];
  expect(image).toBeTruthy();
  expect(html).toContain('<meta property="og:image:width" content="1200"');
  expect(html).toContain('<meta property="og:title" content="Orbite Silencieuse');

  const card = await request.get(new URL(image ?? "", "http://localhost").pathname + (new URL(image ?? "", "http://localhost").search));
  expect(card.status()).toBe(200);
  expect(card.headers()["content-type"]).toContain("image/png");

  await page.route(/posthog/, (route) => route.abort());
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.goto(TITLE_PATH);
  await expect(page.getByRole("heading", { level: 1, name: "Orbite Silencieuse" })).toBeVisible();
});

test("ordinateur sans partage natif : « Partager » copie le lien de la fiche", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
  });
  await page.route(/posthog/, (route) => route.abort());
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.goto(TITLE_PATH);
  await page.getByRole("button", { name: "Partager" }).click();
  await expect(page.getByText("Lien copié")).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(new RegExp(`${TITLE_PATH}$`));
});
