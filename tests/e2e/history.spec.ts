import { expect, test } from "@playwright/test";

// Historique (U17) : réservé aux comptes. Un visiteur est envoyé vers la connexion, qui l'y ramènera.
test("visiteur : /historique renvoie vers la connexion avec retour prévu", async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
  await page.goto("/historique");
  await expect(page).toHaveURL(/\/connexion\?suite=%2Fhistorique$|\/connexion\?suite=\/historique$/);
  // Les deux formulaires (Google et email) ramèneront vers l'historique après connexion.
  const next = page.locator('input[name="next"]');
  await expect(next).toHaveCount(2);
  for (const input of await next.all()) await expect(input).toHaveValue("/historique");
});
