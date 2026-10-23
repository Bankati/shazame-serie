import { expect, test } from "@playwright/test";

// Thème (AD-49) : clair par défaut ; le bouton de l'en-tête passe au sombre, le choix survit au rechargement et à
// la navigation, et le bouton permet de revenir au clair.
test.beforeEach(async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
});

test("bascule clair / sombre, choix conservé", async ({ page }) => {
  await page.goto("/calendrier");
  const html = page.locator("html");
  await expect(html).not.toHaveClass(/\bdark\b/);

  await page.getByRole("button", { name: "Passer au thème sombre" }).click();
  await expect(html).toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(20, 20, 20)");

  await page.reload();
  await expect(html).toHaveClass(/\bdark\b/);
  await page.goto("/");
  await expect(html).toHaveClass(/\bdark\b/);

  await page.getByRole("button", { name: "Passer au thème clair" }).click();
  await expect(html).not.toHaveClass(/\bdark\b/);
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(248, 249, 250)");
});
