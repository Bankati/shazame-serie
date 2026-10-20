import { describe, expect, it } from "vitest";

import { ClipError } from "./clip-error";
import { shouldUseFallback } from "./fallback";

describe("shouldUseFallback", () => {
  it("lecture native illisible (ouverture ou déplacement en échec) : secours", () => {
    expect(shouldUseFallback("native", { ok: false, error: new ClipError("unreadable") }, false)).toBe(true);
  });

  it("lecture native aux images toutes vides : secours", () => {
    expect(shouldUseFallback("native", { ok: true, blank: true }, false)).toBe(true);
  });

  it("lecture native réussie : pas de secours", () => {
    expect(shouldUseFallback("native", { ok: true, blank: false }, false)).toBe(false);
  });

  it("refus qui ne tient pas au décodage : pas de secours", () => {
    expect(shouldUseFallback("native", { ok: false, error: new ClipError("too_short") }, false)).toBe(false);
    expect(shouldUseFallback("native", { ok: false, error: new Error("inattendue") }, false)).toBe(false);
  });

  it("annulation : pas de secours", () => {
    expect(shouldUseFallback("native", { ok: false, error: new ClipError("unreadable") }, true)).toBe(false);
    expect(shouldUseFallback("native", { ok: true, blank: true }, true)).toBe(false);
  });

  it("déjà en lecture de secours : pas de second secours", () => {
    expect(shouldUseFallback("ffmpeg", { ok: false, error: new ClipError("unreadable") }, false)).toBe(false);
    expect(shouldUseFallback("ffmpeg", { ok: true, blank: true }, false)).toBe(false);
  });
});
