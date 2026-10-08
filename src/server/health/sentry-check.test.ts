import { describe, expect, it } from "vitest";

import { isAuthorizedSentryCheck } from "./sentry-check";

const SECRET = "x".repeat(32);

describe("isAuthorizedSentryCheck", () => {
  it("accepte le bon secret", () => {
    expect(isAuthorizedSentryCheck(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it.each([
    ["en-tête absent", null],
    ["mauvais secret", `Bearer ${"y".repeat(32)}`],
    ["secret sans préfixe Bearer", SECRET],
    ["en-tête vide", ""],
  ])("refuse : %s", (_label, header) => {
    expect(isAuthorizedSentryCheck(header, SECRET)).toBe(false);
  });

  it("refuse tout quand aucun secret n'est configuré", () => {
    expect(isAuthorizedSentryCheck("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedSentryCheck("Bearer undefined", undefined)).toBe(false);
  });
});
