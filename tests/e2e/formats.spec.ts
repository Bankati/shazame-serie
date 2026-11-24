import { existsSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U33 : chaque format de vidéo d'essai aboutit à 2 à 5 images envoyées, la vidéo n'est
// jamais envoyée. Vidéos de synthèse générées par `npm run fixtures:videos` (ignorées par git). Les formats
// que Chrome ne décode pas (AVI, H.263, HEVC sans décodeur matériel) passent par la lecture de secours.
const VIDEOS = path.join(__dirname, "fixtures", "videos");
const PACKAGE_MAX_BYTES = 1_572_864;
const RESET_AT = "2026-07-14T22:00:00.000Z";

test.beforeAll(() => {
  if (!existsSync(path.join(VIDEOS, "h264.mp4"))) {
    throw new Error("Vidéos d'essai absentes : lancer `npm run fixtures:videos`.");
  }
});

async function simulateServer(page: Page) {
  const sent: { frames: number }[] = [];
  let largestRequest = 0;
  page.on("request", (request) => {
    largestRequest = Math.max(largestRequest, request.postDataBuffer()?.length ?? 0);
  });
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: RESET_AT } } }),
  );
  await page.route("**/api/identify", async (route) => {
    const body = route.request().postDataBuffer()?.toString("latin1") ?? "";
    sent.push({ frames: (body.match(/name="frames"/g) ?? []).length });
    await route.fulfill({ status: 503, json: { ok: false, error: { code: "AI_UNAVAILABLE", message: "Indisponible" } } });
  });
  await page.route(/posthog/, (route) => route.abort());
  return { sent, largestRequest: () => largestRequest };
}

async function chooseVideo(page: Page, name: string) {
  await page.goto("/identifier");
  const input = page.locator('input[type="file"]');
  // Sous charge, l'envoi peut précéder l'hydratation : on recommence jusqu'à voir la lecture démarrer.
  await expect(async () => {
    await input.setInputFiles(path.join(VIDEOS, name));
    await expect(page.getByRole("button", { name: "Choisir un clip" })).toBeHidden({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

async function expectFramesSent(page: Page, server: Awaited<ReturnType<typeof simulateServer>>) {
  await expect(page.getByText("L'identification est momentanément indisponible.", { exact: false })).toBeVisible({
    timeout: 150_000,
  });
  expect(server.sent).toHaveLength(1);
  expect(server.sent[0]?.frames).toBeGreaterThanOrEqual(2);
  expect(server.sent[0]?.frames).toBeLessThanOrEqual(5);
  // Invariant 1 : aucune requête ne dépasse le paquet d'images (la vidéo de 64 Mo n'est jamais envoyée).
  expect(server.largestRequest()).toBeLessThanOrEqual(PACKAGE_MAX_BYTES + 64 * 1024);
}

for (const name of ["h264.mp4", "h264.mov", "h264.m4v", "h264.mkv", "vp9.webm", "h263.3gp", "mpeg4.avi", "hevc.mp4", "hevc.mov", "large-60mb.mp4"]) {
  test(`${name} : images extraites et envoyées, jamais la vidéo`, async ({ page }) => {
    test.setTimeout(180_000);
    const server = await simulateServer(page);
    await chooseVideo(page, name);
    await expectFramesSent(page, server);
  });
}

test("vidéo de 150 s : choix du passage avant l'analyse, rien n'est envoyé avant", async ({ page }) => {
  test.setTimeout(180_000);
  const server = await simulateServer(page);
  await chooseVideo(page, "long-150s.mp4");

  await expect(page.getByText("Choisissez le passage à analyser")).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("Cette vidéo dure 2:30.", { exact: false })).toBeVisible();
  const slider = page.getByRole("slider", { name: "Début du passage" });
  // Le bouton d'envoi a disparu : le focus passe au curseur (clavier, lecteur d'écran).
  await expect(slider).toBeFocused();
  await expect(slider).toHaveValue("45");
  await expect(page.getByText("De 0:45 à 1:45")).toBeVisible();
  await slider.fill("80");
  await expect(page.getByText("De 1:20 à 2:20")).toBeVisible();
  expect(server.sent).toHaveLength(0);

  await page.getByRole("button", { name: "Analyser ce passage" }).click();
  await expectFramesSent(page, server);
});

test("« Annuler » pendant la lecture de secours : retour à la zone d'envoi, rien n'est envoyé", async ({ page }) => {
  test.setTimeout(120_000);
  const server = await simulateServer(page);
  // Lecteur de secours ralenti : on a le temps d'annuler pendant sa préparation.
  await page.route("**/ffmpeg/core-*/ffmpeg-core.wasm", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    await route.continue().catch(() => undefined);
  });
  await chooseVideo(page, "mpeg4.avi");

  await expect(page.getByText("lecteur de secours", { exact: false })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("button", { name: "Choisir un clip" })).toBeFocused();
  await page.waitForTimeout(12_000);
  expect(server.sent).toHaveLength(0);
  await expect(page.getByRole("button", { name: "Choisir un clip" })).toBeVisible();
});

test("format non pris en charge : refus immédiat, sans lecture", async ({ page }) => {
  await simulateServer(page);
  await page.goto("/identifier");
  const input = page.locator('input[type="file"]');
  await expect(async () => {
    await input.setInputFiles({ name: "clip.wmv", mimeType: "video/x-ms-wmv", buffer: Buffer.from("pas une vidéo") });
    await expect(page.getByText("Ce format n'est pas pris en charge", { exact: false })).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
});
