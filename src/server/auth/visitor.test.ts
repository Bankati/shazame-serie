import { describe, expect, it, vi } from "vitest";

import { newVisitorId, signVisitorId, verifyVisitorCookie } from "./visitor";

vi.mock("@/server/env", () => ({ env: {} }));

const KEY = "k".repeat(32);

describe("cookie visiteur", () => {
  it("vérifie un cookie signé avec le même secret", () => {
    const id = newVisitorId();
    expect(verifyVisitorCookie(signVisitorId(id, KEY), KEY)).toBe(id);
  });

  it.each([
    ["absent", undefined],
    ["sans signature", "6f1c1c1e-1111-4111-8111-111111111111"],
    ["identifiant non UUID", "admin.abc"],
  ])("refuse un cookie %s", (_label, value) => {
    expect(verifyVisitorCookie(value, KEY)).toBeNull();
  });

  it("refuse un identifiant modifié ou un autre secret", () => {
    const signed = signVisitorId(newVisitorId(), KEY);
    const [, mac] = signed.split(".");
    expect(verifyVisitorCookie(`${newVisitorId()}.${mac}`, KEY)).toBeNull();
    expect(verifyVisitorCookie(signed, "z".repeat(32))).toBeNull();
  });

  it("utilise un secret temporaire cohérent quand aucun n'est configuré", () => {
    const id = newVisitorId();
    expect(verifyVisitorCookie(signVisitorId(id))).toBe(id);
  });
});
