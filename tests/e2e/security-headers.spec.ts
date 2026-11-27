import { readFileSync } from "node:fs";
import path from "node:path";

import { expect, type Page, test } from "@playwright/test";

// U28 (CDC 18.1, AD-53) : en-têtes de sécurité présents, et aucune violation de la CSP sur les pages principales
// (une ressource bloquée casserait l'affichage sans erreur visible).
const POSTER = readFileSync(path.join(__dirname, "fixtures", "poster.jpg"));
const PAGES = ["/", "/identifier", "/identifier?mode=description", "/tarifs", "/calendrier", "/connexion", "/titre/film/9001-orbite-silencieuse"];

/** Violations de CSP signalées par le navigateur pendant la visite. */
async function watchViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  await page.exposeFunction("__reportCspViolation", (text: string) => violations.push(text));
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      (window as unknown as { __reportCspViolation: (text: string) => void }).__reportCspViolation(
        `${event.violatedDirective} ${event.blockedURI}`,
      );
    });
  });
  return violations;
}

test("en-têtes de sécurité sur les pages et l'API", async ({ request }) => {
  for (const url of ["/", "/api/health"]) {
    const response = await request.get(url);
    const headers = response.headers();
    expect(headers["content-security-policy"], url).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"], url).toContain("object-src 'none'");
    expect(headers["x-content-type-options"], url).toBe("nosniff");
    expect(headers["referrer-policy"], url).toBe("strict-origin-when-cross-origin");
    expect(headers["x-frame-options"], url).toBe("DENY");
  }
});

for (const pagePath of PAGES) {
  test(`aucune violation de la CSP : ${pagePath}`, async ({ page }) => {
    const violations = await watchViolations(page);
    // Affiches TMDB simulées (même origine que la vraie, donc même règle CSP) ; aucun envoi à PostHog.
    await page.route("https://image.tmdb.org/**", (route) => route.fulfill({ body: POSTER, contentType: "image/jpeg" }));
    await page.route(/posthog/, (route) => route.abort());
    // Sans attendre le repos du réseau : l'état de « Ma liste » se charge à part (calendrier, fiche).
    await page.goto(pagePath, { waitUntil: "load" });
    await expect(page.locator("main")).toBeVisible();
    await page.mouse.wheel(0, 4000);
    await page.waitForTimeout(1_500);
    expect(violations).toEqual([]);
  });
}
