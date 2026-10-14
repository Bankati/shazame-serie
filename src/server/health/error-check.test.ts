import { describe, expect, it } from "vitest";

import { isAuthorizedErrorCheck } from "./error-check";

const SECRET = "x".repeat(32);

describe("isAuthorizedErrorCheck", () => {
  it("accepte le bon secret", () => {
    expect(isAuthorizedErrorCheck(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it.each([
    ["en-tête absent", null],
    ["mauvais secret", `Bearer ${"y".repeat(32)}`],
    ["secret sans préfixe Bearer", SECRET],
    ["en-tête vide", ""],
  ])("refuse : %s", (_label, header) => {
    expect(isAuthorizedErrorCheck(header, SECRET)).toBe(false);
  });

  it("refuse tout quand aucun secret n'est configuré", () => {
    expect(isAuthorizedErrorCheck("Bearer ", undefined)).toBe(false);
    expect(isAuthorizedErrorCheck("Bearer undefined", undefined)).toBe(false);
  });
});
