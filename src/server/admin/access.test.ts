import { describe, expect, it } from "vitest";

import { type Account, checkAccess } from "@/server/auth/guards";

import { adminPageAccess } from "./access";

const base: Account = { id: "u1", email: null, displayName: null, role: "user", status: "active" };

describe("adminPageAccess", () => {
  it("visiteur → connexion", () => {
    expect(adminPageAccess(checkAccess(null, { admin: true }))).toEqual({ kind: "sign-in" });
  });

  it("compte sans rôle admin → 404", () => {
    expect(adminPageAccess(checkAccess(base, { admin: true }))).toEqual({ kind: "not-found" });
  });

  it("admin suspendu → 404", () => {
    expect(adminPageAccess(checkAccess({ ...base, role: "admin", status: "suspended" }, { admin: true }))).toEqual({
      kind: "not-found",
    });
  });

  it("admin actif → autorisé", () => {
    expect(adminPageAccess(checkAccess({ ...base, role: "admin" }, { admin: true }))).toEqual({
      kind: "allowed",
      adminId: "u1",
    });
  });
});
