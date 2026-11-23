import { describe, expect, it } from "vitest";

import { decideStatusChange, type StatusTarget, toSearchPattern } from "./user-rules";

const user = (fields: Partial<StatusTarget> = {}): StatusTarget => ({
  id: "u1",
  role: "user",
  status: "active",
  deleted: false,
  ...fields,
});

describe("decideStatusChange", () => {
  it("suspend un compte actif", () => {
    expect(decideStatusChange("admin", user(), "suspended")).toEqual({ kind: "change" });
  });

  it("réactive un compte suspendu", () => {
    expect(decideStatusChange("admin", user({ status: "suspended" }), "active")).toEqual({ kind: "change" });
  });

  it("ne fait rien si le statut est déjà celui demandé", () => {
    expect(decideStatusChange("admin", user({ status: "suspended" }), "suspended")).toEqual({ kind: "unchanged" });
  });

  it("refuse un compte absent ou supprimé", () => {
    expect(decideStatusChange("admin", null, "suspended")).toEqual({ kind: "refused", reason: "not_found" });
    expect(decideStatusChange("admin", user({ deleted: true }), "suspended")).toEqual({ kind: "refused", reason: "not_found" });
  });

  it("refuse de toucher à son propre compte ou à un autre admin", () => {
    expect(decideStatusChange("u1", user(), "suspended")).toEqual({ kind: "refused", reason: "self" });
    expect(decideStatusChange("admin", user({ role: "admin" }), "suspended")).toEqual({
      kind: "refused",
      reason: "admin_target",
    });
  });
});

describe("toSearchPattern", () => {
  it("entoure la recherche de jokers", () => {
    expect(toSearchPattern("  marie ")).toBe("%marie%");
  });

  it("neutralise les jokers saisis", () => {
    expect(toSearchPattern("50%_a\\b")).toBe("%50\\%\\_a\\\\b%");
  });

  it("renvoie null pour une recherche vide", () => {
    expect(toSearchPattern("   ")).toBeNull();
  });
});
