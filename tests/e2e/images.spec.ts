import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U34 : capture → résultat, avec IA simulée. L'image d'essai est l'affiche de synthèse des
// autres tests (aucun contenu protégé) ; la préparation des images est réelle, seul le serveur est simulé.
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));
const RESET_AT = "2026-07-14T22:00:00.000Z";
const MATRIX = { tmdbId: 603, mediaType: "movie", title: "Matrix", year: 1999, posterPath: "/matrix.jpg", confidence: 94 };

type Sent = { mode: string | null; frames: number; bytes: number };

async function simulateServer(page: Page) {
  const sent: Sent[] = [];
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: RESET_AT } } }),
  );
  await page.route("**/api/identify", async (route) => {
    const body = route.request().postDataBuffer() ?? Buffer.alloc(0);
    const text = body.toString("latin1");
    sent.push({
      mode: /name="mode"\r\n\r\n(\w+)/.exec(text)?.[1] ?? null,
      frames: (text.match(/name="frames"/g) ?? []).length,
      bytes: body.length,
    });
    await route.fulfill({
      json: { ok: true, data: { decision: "show", source: "ai", main: MATRIX, alternatives: [], quota: { limit: 3, remaining: 2, resetAt: RESET_AT } } },
    });
  });
  await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
  await page.route(/posthog/, (route) => route.abort());
  return sent;
}

type Upload = { name: string; mimeType: string; buffer: Buffer };
const capture = (name: string): Upload => ({ name, mimeType: "image/jpeg", buffer: POSTER });

async function choose(page: Page, files: Upload[]) {
  await page.goto("/identifier");
  const input = page.locator('input[type="file"]');
  // Sous charge, l'envoi peut précéder l'hydratation : on recommence jusqu'à voir la sélection prise en compte.
  await expect(async () => {
    await input.setInputFiles(files);
    await expect(page.getByRole("button", { name: "Choisir un clip" })).toBeHidden({ timeout: 2_000 });
  }).toPass({ timeout: 20_000 });
}

test("une capture → résultat : mode « images », une seule image envoyée, réduite", async ({ page }) => {
  const sent = await simulateServer(page);
  await choose(page, [capture("capture.jpg")]);

  await expect(page.getByRole("heading", { name: "Matrix" })).toBeVisible({ timeout: 30_000 });
  expect(sent).toEqual([{ mode: "images", frames: 1, bytes: expect.any(Number) }]);
  expect(sent[0]!.bytes).toBeLessThanOrEqual(1_572_864 + 64 * 1024);
});

test("trois fois la même capture : les doublons sont écartés, une seule image envoyée", async ({ page }) => {
  const sent = await simulateServer(page);
  await choose(page, [capture("a.jpg"), capture("b.jpg"), capture("c.jpg")]);

  await expect(page.getByRole("heading", { name: "Matrix" })).toBeVisible({ timeout: 30_000 });
  expect(sent[0]).toMatchObject({ mode: "images", frames: 1 });
  await page.getByRole("button", { name: "Fermer le résultat" }).click();
  await expect(page.getByText("Doublon")).toHaveCount(2);
});

for (const [label, files, message] of [
  ["6 captures", Array.from({ length: 6 }, (_, index) => capture(`${index}.jpg`)), "Choisissez 5 captures au maximum."],
  [
    "une vidéo et une capture",
    [{ name: "clip.mp4", mimeType: "video/mp4", buffer: Buffer.from("x") }, capture("a.jpg")],
    "Choisissez soit une vidéo, soit des captures d'écran, pas les deux à la fois.",
  ],
] as const) {
  test(`${label} : refus clair, rien n'est envoyé`, async ({ page }) => {
    const sent = await simulateServer(page);
    await page.goto("/identifier");
    const input = page.locator('input[type="file"]');
    await expect(async () => {
      await input.setInputFiles([...files]);
      await expect(page.getByText(message)).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 20_000 });
    expect(sent).toHaveLength(0);
  });
}

test("signalement d'une identification par capture : la capture seule accompagne le signalement (consentement)", async ({ page }) => {
  await simulateServer(page);
  const reports: { frames: number }[] = [];
  await page.route("**/api/reports", async (route) => {
    const text = route.request().postDataBuffer()?.toString("latin1") ?? "";
    reports.push({ frames: (text.match(/name="frames"/g) ?? []).length });
    await route.fulfill({ status: 201, json: { ok: true, data: { reportId: "r1", imagesStored: 1 } } });
  });
  await page.route("**/api/identify", (route) =>
    route.fulfill({
      json: {
        ok: true,
        data: {
          decision: "show",
          source: "ai",
          main: MATRIX,
          alternatives: [],
          quota: { limit: 3, remaining: 2, resetAt: RESET_AT },
          identificationId: "6f1c2a3b-0000-4000-8000-0000000000aa",
        },
      },
    }),
  );
  await choose(page, [capture("capture.jpg")]);
  await page.getByRole("button", { name: "Ce n'est pas le bon titre ?" }).click({ timeout: 30_000 });
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await expect.poll(() => reports.length).toBe(1);
  expect(reports[0]).toEqual({ frames: 1 });
});
