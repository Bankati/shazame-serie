import type { ErrorEvent } from "@sentry/nextjs";
import { describe, expect, it } from "vitest";

import { redactEmails, scrubEvent, scrubTransaction } from "./sentry";

function makeEvent(): ErrorEvent {
  return {
    type: undefined,
    message: "Échec pour jean.dupont@example.com",
    user: { id: "u1", email: "jean.dupont@example.com", ip_address: "1.2.3.4" },
    request: {
      url: "https://site.example/api/identify?token=abc",
      cookies: { "sb-access-token": "secret" },
      headers: { authorization: "Bearer secret", cookie: "a=b" },
      data: "corps de requête",
      query_string: "token=abc",
    },
    exception: { values: [{ type: "Error", value: "Utilisateur marie@example.org introuvable" }] },
    breadcrumbs: [{ message: "fetch vers paul@example.net", data: { url: "https://x?email=paul@example.net" } }],
    extra: { body: "images" },
  };
}

describe("scrubEvent", () => {
  it("retire utilisateur, cookies, en-têtes, corps et paramètres d'URL", () => {
    const event = scrubEvent(makeEvent());

    expect(event.user).toBeUndefined();
    expect(event.request).toEqual({ url: "https://site.example/api/identify" });
    expect(event.extra).toBeUndefined();
    expect(event.breadcrumbs?.[0]?.data).toBeUndefined();
  });

  it("masque les emails dans les messages, exceptions et fils d'Ariane", () => {
    const serialized = JSON.stringify(scrubEvent(makeEvent()));

    expect(serialized).not.toMatch(/@example\./);
    expect(serialized).toContain("[email]");
  });

  it("conserve la stack et le type d'erreur", () => {
    const event = scrubEvent(makeEvent());

    expect(event.exception?.values?.[0]?.type).toBe("Error");
  });
});

describe("scrubTransaction", () => {
  it("retire utilisateur, en-têtes, cookies, paramètres et fragment d'URL des traces", () => {
    const event = scrubTransaction({
      type: "transaction",
      transaction: "GET /api/health",
      user: { email: "jean.dupont@example.com" },
      request: { url: "https://site.example/compte?email=a@b.fr#section", headers: { cookie: "a=b" } },
      extra: { body: "x" },
    });

    expect(event.user).toBeUndefined();
    expect(event.extra).toBeUndefined();
    expect(event.request).toEqual({ url: "https://site.example/compte" });
    expect(event.transaction).toBe("GET /api/health");
  });
});

describe("redactEmails", () => {
  it("laisse intact un texte sans email", () => {
    expect(redactEmails("Erreur TMDB 502")).toBe("Erreur TMDB 502");
  });
});
