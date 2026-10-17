import { expect, type Page, test } from "@playwright/test";

// Critère de fin de U04 : inscription → confirmation → connexion → déconnexion ; lien de réinitialisation
// utilisable une seule fois. Contre Supabase local : les emails sont lus dans Mailpit (aucun envoi réel).
// Lancé par le job CI « Parcours compte » (MAILPIT_URL défini) ; ignoré ailleurs.
const MAILPIT_URL = process.env.MAILPIT_URL;

test.skip(!MAILPIT_URL, "Supabase local et Mailpit requis (MAILPIT_URL)");

const PASSWORD = "motdepasse-e2e";
// Réponses des Server Actions (Supabase Auth, base) : plus lentes que l'interface seule, surtout en local
// quand les autres tests (pages animées) tournent en parallèle sur le même serveur.
const SERVER = { timeout: 30_000 };
const NEW_PASSWORD = "nouveau-motdepasse-e2e";

type MailpitSearch = { messages: { ID: string; Subject: string }[] };
type MailpitMessage = { HTML: string };

/** Dernier email reçu par `to` dont le sujet contient `subject`, et le lien du bouton. */
async function linkFromEmail(to: string, subject: string): Promise<string> {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const search = (await (await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)).json()) as MailpitSearch;
    const message = search.messages.find((candidate) => candidate.Subject.includes(subject));
    if (message) {
      const { HTML } = (await (await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)).json()) as MailpitMessage;
      const href = HTML.match(/href="([^"]+token_hash=[^"]+)"/)?.[1];
      if (href) return href.replaceAll("&amp;", "&");
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Aucun email « ${subject} » reçu`);
}

// Juste après une connexion, la page d'accueil est encore en train de s'afficher : un clic trop tôt
// peut se perdre. On réessaie jusqu'à ce que le menu soit ouvert.
async function openMenu(page: Page) {
  const menu = page.getByRole("dialog", { name: "Menu" });
  await expect(async () => {
    if (!(await menu.isVisible())) await page.getByRole("button", { name: "Ouvrir le menu" }).click();
    await expect(menu).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  return menu;
}

test.beforeEach(async ({ page }) => {
  await page.route(/posthog/, (route) => route.abort());
});

test("inscription → confirmation → déconnexion → connexion, puis lien de réinitialisation à usage unique", async ({ page }) => {
  // Parcours long (une quinzaine d'allers-retours avec Supabase) : plus que les 30 s par défaut.
  test.setTimeout(150_000);
  const email = `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;

  // Inscription : la case d'acceptation est obligatoire et non cochée par défaut.
  await page.goto("/inscription");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  const accept = page.getByRole("checkbox");
  await expect(accept).not.toBeChecked();
  await accept.check();
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page.getByRole("status")).toContainText("Vérifiez votre boîte mail", SERVER);

  // Confirmation par le lien reçu : compte activé, session ouverte, écran de bienvenue.
  await page.goto(await linkFromEmail(email, "Confirmez votre adresse"));
  await expect(page).toHaveURL(/\/bienvenue$/, SERVER);
  await expect(page.getByRole("heading", { name: /Bienvenue/ })).toBeVisible();
  await expect(page.getByText("15 identifications par jour", { exact: false })).toBeVisible();

  // Déconnexion depuis le menu.
  let menu = await openMenu(page);
  await expect(menu.getByText(email)).toBeVisible();
  await menu.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/, SERVER);
  menu = await openMenu(page);
  await expect(menu.getByRole("link", { name: "Se connecter" })).toBeVisible();

  // Connexion : mauvais mot de passe refusé, puis le bon.
  await page.goto("/connexion");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill("pas-le-bon");
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Adresse email ou mot de passe incorrect", SERVER);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, SERVER);
  menu = await openMenu(page);
  await expect(menu.getByText(email)).toBeVisible();
  await menu.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page).toHaveURL(/\/$/, SERVER);

  // Mot de passe oublié : le lien ouvre la page du nouveau mot de passe.
  await page.goto("/mot-de-passe-oublie");
  await page.getByLabel("Adresse email").fill(email);
  await page.getByRole("button", { name: "Envoyer le lien" }).click();
  await expect(page.getByRole("status")).toContainText("Si un compte existe", SERVER);
  const resetLink = await linkFromEmail(email, "Réinitialisez votre mot de passe");
  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/mot-de-passe\/nouveau$/, SERVER);
  await page.getByLabel("Nouveau mot de passe", { exact: true }).fill(NEW_PASSWORD);
  await page.getByLabel("Confirmez le mot de passe", { exact: true }).fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Enregistrer le mot de passe" }).click();
  await expect(page.getByRole("status")).toContainText("Votre mot de passe a été modifié", SERVER);

  // Le même lien ne sert qu'une fois (RG10).
  await page.context().clearCookies();
  await page.goto(resetLink);
  await expect(page).toHaveURL(/\/connexion\?erreur=lien$/, SERVER);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Ce lien n'est plus valable", SERVER);

  // L'ancien mot de passe ne marche plus, le nouveau oui.
  await page.getByLabel("Adresse email").fill(email);
  await page.getByLabel("Mot de passe", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page.getByRole("main").getByRole("alert").last()).toContainText("Adresse email ou mot de passe incorrect", SERVER);
  await page.getByLabel("Mot de passe", { exact: true }).fill(NEW_PASSWORD);
  await page.getByRole("button", { name: "Se connecter", exact: true }).click();
  await expect(page).toHaveURL(/\/$/, SERVER);
});

test("une redirection après connexion ne peut pas sortir du site", async ({ page }) => {
  await page.goto("/connexion?suite=//evil.example");
  await expect(page.locator('input[name="next"]')).toHaveCount(0);
});
