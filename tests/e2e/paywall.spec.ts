import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U21 : quota épuisé → paywall adapté au profil, fiche toujours accessible ; page /tarifs.
// Serveur simulé (aucun appel payant). Titre fictif servi par le faux TMDB (scripts/tmdb-mock.mjs).
const RESET_AT = "2026-07-14T22:00:00.000Z";
const TITLE_PATH = "/titre/film/9001-orbite-silencieuse";

async function simulate(
  page: Page,
  { quota, account }: { quota: Record<string, unknown>; account: Record<string, unknown> | null },
) {
  await page.route(/posthog/, (route) => route.abort());
  await page.route("https://image.tmdb.org/**", (route) => route.abort());
  await page.route("**/api/quota", (route) => route.fulfill({ json: { ok: true, data: quota } }));
  await page.route("**/api/account", (route) => route.fulfill({ json: { ok: true, data: { account } } }));
  await page.route("**/api/identify/description", (route) =>
    route.fulfill({
      status: 429,
      json: {
        ok: false,
        error: {
          code: "QUOTA_EXCEEDED",
          message: "…",
          details: { quota: { plan: "visitor", limit: 3, remaining: 0, resetAt: RESET_AT } },
        },
      },
    }),
  );
}

test("visiteur : le refus du serveur affiche le paywall (compte gratuit), la fiche reste consultable", async ({
  page,
}) => {
  await simulate(page, { quota: { plan: "visitor", limit: 3, remaining: 1, resetAt: RESET_AT }, account: null });
  await page.goto("/identifier?mode=description");

  const field = page.getByLabel("Décrire le film ou la série");
  await expect(field).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /identifications du jour sont utilisées/ })).toHaveCount(0);
  await field.fill("Un homme revit sans cesse la même journée dans une petite ville enneigée");
  await page.getByRole("button", { name: "Identifier" }).click();

  const paywall = page.getByRole("region", { name: "Vos 3 identifications du jour sont utilisées" });
  await expect(paywall).toBeVisible({ timeout: 20_000 });
  await expect(paywall.getByRole("link", { name: "Créer un compte gratuit" })).toHaveAttribute(
    "href",
    "/inscription?suite=%2Fidentifier",
  );
  await expect(paywall.getByRole("link", { name: "Voir les tarifs" })).toHaveAttribute("href", "/tarifs");
  await expect(paywall.getByText("De nouvelles identifications à minuit, heure de Paris.")).toBeVisible();

  // Fiches jamais bloquées (CDC 12.8).
  await page.goto(TITLE_PATH);
  await expect(page.getByRole("heading", { level: 1, name: "Orbite Silencieuse" })).toBeVisible();
});

test("compte gratuit sans identification restante : paywall dès l'arrivée, puis la page des tarifs", async ({
  page,
}) => {
  await simulate(page, {
    quota: { plan: "free", limit: 15, remaining: 0, resetAt: RESET_AT },
    account: { displayName: "Camille", email: null, avatarUrl: null },
  });
  await page.goto("/identifier");

  const paywall = page.getByRole("region", { name: "Vos 15 identifications du jour sont utilisées" });
  await expect(paywall).toBeVisible({ timeout: 20_000 });
  await expect(paywall.getByRole("link", { name: "Historique" })).toBeVisible();
  await paywall.getByRole("link", { name: "Découvrir Premium" }).click();

  await page.waitForURL(/\/tarifs$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { level: 1, name: "Des tarifs simples" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Bientôt disponible" })).toBeDisabled();
  const table = page.getByRole("table", { name: "Ce que comprend chaque offre" });
  await expect(table.getByRole("row", { name: /Identifications par jour/ })).toContainText("Jusqu'à 100");
  await expect(page.getByRole("link", { name: "Commencer gratuitement" })).toHaveAttribute("href", "/identifier");
});

test("Premium à sa limite : prévenu, sans invitation à payer", async ({ page }) => {
  await simulate(page, {
    quota: { plan: "premium", limit: 100, remaining: 0, resetAt: RESET_AT },
    account: { displayName: "Camille", email: null, avatarUrl: null },
  });
  await page.goto("/identifier");

  const paywall = page.getByRole("region", { name: "Limite du jour atteinte" });
  await expect(paywall).toBeVisible({ timeout: 20_000 });
  await expect(paywall).toContainText("jusqu'à 100 identifications par jour");
  await expect(paywall.getByRole("link", { name: /Premium|tarifs|compte/ })).toHaveCount(0);
});

test("abonnement (U22) : page réservée aux comptes ; sans Stripe configuré, Premium reste annoncé", async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
  await page.goto("/compte/abonnement");
  await page.waitForURL(/\/connexion\?suite=%2Fcompte%2Fabonnement/, { timeout: 15_000 });

  // Environnement de test sans clés Stripe : aucun bouton de paiement, aucune simulation.
  await page.goto("/tarifs");
  await expect(page.getByRole("button", { name: "Bientôt disponible" })).toBeDisabled();
  await expect(page.getByRole("button", { name: /S'abonner/ })).toHaveCount(0);
});
