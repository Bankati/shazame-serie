import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U35 : description → résultat, avec IA simulée (aucun appel payant).
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));
const RESET_AT = "2026-07-14T22:00:00.000Z";
const GROUNDHOG = { tmdbId: 137, mediaType: "movie", title: "Un jour sans fin", year: 1993, posterPath: "/g.jpg", confidence: 92 };
const TEXT = "Un homme revit sans cesse la même journée dans une petite ville enneigée";

async function simulateServer(page: Page, identify: { status: number; body: unknown }) {
  const sent: unknown[] = [];
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: RESET_AT } } }),
  );
  await page.route("**/api/identify/description", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: identify.status, json: identify.body });
  });
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.route(/posthog/, (route) => route.abort());
  return sent;
}

async function openDescriptionTab(page: Page) {
  await page.goto("/");
  const tab = page.getByRole("tab", { name: "Description" });
  // Sous charge, le clic peut précéder l'hydratation : on recommence jusqu'à voir le champ.
  await expect(async () => {
    await tab.click();
    await expect(page.getByLabel("Décrire le film ou la série")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

test("description → résultat sûr : titre, confiance, compteur ; texte envoyé tel quel, une seule fois", async ({ page }) => {
  const sent = await simulateServer(page, {
    status: 200,
    body: { ok: true, data: { decision: "show", source: "ai", main: GROUNDHOG, alternatives: [], quota: { limit: 3, remaining: 2, resetAt: RESET_AT } } },
  });
  await openDescriptionTab(page);

  const field = page.getByLabel("Décrire le film ou la série");
  // Changement d'onglet : le focus reste sur l'onglet (WAI-ARIA).
  await expect(page.getByRole("tab", { name: "Description" })).toBeFocused();
  const submit = page.getByRole("button", { name: "Identifier" });
  await field.fill("trop court");
  await expect(page.getByText("10 / 500 caractères")).toBeVisible();
  await field.fill("court");
  await expect(submit).toBeDisabled();
  await field.fill(TEXT);
  await submit.click();

  await expect(page.getByRole("heading", { name: "Un jour sans fin" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText("Très probable, 92 %")).toBeVisible();
  await expect(page.getByText("2 restantes")).toBeVisible();
  expect(sent).toEqual([{ text: TEXT }]);

  // « Décrire un autre titre » : champ vide, focus rendu.
  await page.getByRole("button", { name: "Décrire un autre titre" }).first().click();
  await expect(page.getByLabel("Décrire le film ou la série")).toHaveValue("");
  await expect(page.getByLabel("Décrire le film ou la série")).toBeFocused();
});

test("description non reconnue : message adapté et pistes", async ({ page }) => {
  await simulateServer(page, {
    status: 200,
    body: {
      ok: true,
      data: { decision: "ask_another_clip", source: "ai", main: null, alternatives: [{ ...GROUNDHOG, confidence: 40 }], quota: { limit: 3, remaining: 3, resetAt: RESET_AT } },
    },
  });
  await openDescriptionTab(page);
  await page.getByLabel("Décrire le film ou la série").fill("un film avec une histoire d'amour");
  await page.getByRole("button", { name: "Identifier" }).click();

  await expect(page.getByText("Nous n'avons pas reconnu ce titre avec assez de certitude.", { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Décrire un autre titre" })).toBeVisible();
});

test("quota épuisé : message clair, champ conservé", async ({ page }) => {
  await simulateServer(page, {
    status: 429,
    body: { ok: false, error: { code: "QUOTA_EXCEEDED", message: "Quota", details: { quota: { limit: 3, remaining: 0, resetAt: RESET_AT } } } },
  });
  await openDescriptionTab(page);
  await page.getByLabel("Décrire le film ou la série").fill(TEXT);
  await page.getByRole("button", { name: "Identifier" }).click();

  await expect(page.getByRole("alert").filter({ hasText: "Vous avez atteint votre limite" })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByLabel("Décrire le film ou la série")).toHaveValue(TEXT);
});

test("onglets au clavier : flèches pour changer de mode", async ({ page }) => {
  await simulateServer(page, { status: 200, body: {} });
  await page.goto("/");
  const media = page.getByRole("tab", { name: "Vidéo, image" });
  await expect(media).toHaveAttribute("aria-selected", "true");
  await expect(async () => {
    await media.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Description" })).toHaveAttribute("aria-selected", "true", { timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
  await expect(page.getByRole("tab", { name: "Description" })).toBeFocused();
  await page.keyboard.press("ArrowLeft");
  await expect(media).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Choisir un clip" })).toBeVisible();
});
