import { expect, test } from "@playwright/test";

// Critère de fin de U41 (sans Supabase : ouverture, contenu, fermeture, accès direct). La connexion réelle reste
// couverte par auth.spec.ts (projet « compte »).
test.beforeEach(async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
  await page.route("**/api/quota", (route) =>
    route.fulfill({ json: { ok: true, data: { limit: 3, remaining: 3, resetAt: "2026-10-22T22:00:00.000Z" } } }),
  );
});

test("depuis l'application : la connexion s'ouvre en fenêtre, la page reste derrière, Échap la ferme", async ({ page }) => {
  await page.goto("/identifier", { waitUntil: "networkidle" });
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Connexion" }).click();

  const dialog = page.getByRole("dialog", { name: "Se connecter" });
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/connexion\?suite=%2Fidentifier/);
  await expect(dialog.getByRole("button", { name: /Google/ })).toBeVisible();
  await expect(dialog.getByLabel("Adresse email")).toBeVisible();
  // La page d'identification est toujours là, derrière la fenêtre (masquée aux lecteurs d'écran tant que la
  // fenêtre est ouverte, d'où `includeHidden`).
  await expect(page.getByRole("heading", { level: 1, name: /Quel est ce film/, includeHidden: true })).toBeAttached();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/identifier$/);
});

test("de la connexion à l'inscription, dans la fenêtre", async ({ page }) => {
  await page.goto("/identifier", { waitUntil: "networkidle" });
  await page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Connexion" }).click();
  const signIn = page.getByRole("dialog", { name: "Se connecter" });
  await expect(signIn).toBeVisible({ timeout: 15_000 });
  await signIn.getByRole("link", { name: "Créer un compte" }).click();
  await expect(page.getByRole("dialog", { name: "Créer un compte" })).toBeVisible({ timeout: 15_000 });
  await expect(page).toHaveURL(/\/inscription\?suite=%2Fidentifier/);
});

test("lien direct : la page complète de connexion, sans fenêtre", async ({ page }) => {
  await page.goto("/connexion");
  await expect(page.getByRole("heading", { level: 1, name: "Se connecter" })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
