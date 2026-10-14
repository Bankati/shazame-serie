import { describe, expect, it } from "vitest";

import {
  redactEmails,
  scrubEvent,
  shouldReportBoundaryError,
  stripQueryAndFragment,
  toEnvironment,
  withEnvironment,
} from "./posthog";

type TestEvent = {
  event: string;
  properties?: Record<string, unknown>;
  $set?: Record<string, unknown>;
  $set_once?: Record<string, unknown>;
};

describe("redactEmails", () => {
  it("masque chaque adresse email", () => {
    expect(redactEmails("échec pour jean.dupont@example.fr et a@b.io")).toBe("échec pour [email] et [email]");
  });
});

describe("stripQueryAndFragment", () => {
  it.each([
    ["https://site.example/titre?token=abc#x", "https://site.example/titre"],
    ["https://site.example/reset#access_token=abc", "https://site.example/reset"],
    ["https://site.example/", "https://site.example/"],
  ])("%s → %s", (url, expected) => {
    expect(stripQueryAndFragment(url)).toBe(expected);
  });
});

describe("scrubEvent", () => {
  it("laisse passer null (événement déjà rejeté)", () => {
    expect(scrubEvent(null)).toBeNull();
  });

  it("retire les propriétés de personne", () => {
    const event: TestEvent = { event: "$pageview", $set: { email: "a@b.io" }, $set_once: { name: "x" } };
    const scrubbed = scrubEvent(event);
    expect(scrubbed).not.toHaveProperty("$set");
    expect(scrubbed).not.toHaveProperty("$set_once");
  });

  it("retire paramètres et fragment des URL", () => {
    const scrubbed = scrubEvent<TestEvent>({
      event: "$pageview",
      properties: {
        $current_url: "https://site.example/reinitialiser?code=secret",
        $referrer: "https://autre.example/page?q=film#top",
        $pathname: "/reinitialiser",
      },
    });
    expect(scrubbed?.properties).toMatchObject({
      $current_url: "https://site.example/reinitialiser",
      $referrer: "https://autre.example/page",
      $pathname: "/reinitialiser",
    });
  });

  it("masque les emails dans les propriétés et les exceptions", () => {
    const scrubbed = scrubEvent<TestEvent>({
      event: "$exception",
      properties: {
        $exception_message: "Utilisateur jean@example.fr introuvable",
        $exception_list: [{ type: "Error", value: "Utilisateur jean@example.fr introuvable" }],
        count: 3,
      },
    });
    expect(scrubbed?.properties?.$exception_message).toBe("Utilisateur [email] introuvable");
    expect(scrubbed?.properties?.$exception_list).toEqual([{ type: "Error", value: "Utilisateur [email] introuvable" }]);
    expect(scrubbed?.properties?.count).toBe(3);
  });
});

describe("withEnvironment", () => {
  it("ajoute l'environnement sans écraser les autres propriétés", () => {
    const add = withEnvironment<TestEvent>("preview");
    expect(add({ event: "$pageview", properties: { a: 1 } })?.properties).toEqual({ a: 1, environment: "preview" });
    expect(add(null)).toBeNull();
  });
});

describe("toEnvironment", () => {
  it.each([
    ["preview", "preview"],
    ["production", "production"],
    ["development", "development"],
    [undefined, "development"],
    ["staging", "development"],
  ])("%s → %s", (value, expected) => {
    expect(toEnvironment(value)).toBe(expected);
  });
});

describe("shouldReportBoundaryError", () => {
  it("envoie une erreur née dans le navigateur (sans digest)", () => {
    expect(shouldReportBoundaryError(new Error("x"))).toBe(true);
  });

  it("n'envoie pas une erreur serveur (avec digest), déjà remontée par onRequestError", () => {
    expect(shouldReportBoundaryError(Object.assign(new Error("x"), { digest: "123" }))).toBe(false);
  });
});
