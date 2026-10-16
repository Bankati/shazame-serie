import { describe, expect, it } from "vitest";

import { type Account, checkAccess, toAccount } from "./guards";

const active: Account = { id: "u1", email: "a@example.com", displayName: null, role: "user", status: "active" };

describe("checkAccess", () => {
  it("refuse sans compte", () => {
    expect(checkAccess(null)).toEqual({ ok: false, code: "UNAUTHENTICATED" });
  });

  it("accepte un compte actif", () => {
    expect(checkAccess(active)).toEqual({ ok: true, account: active });
  });

  it("refuse un compte suspendu, sauf pour l'export et la suppression", () => {
    const suspended = { ...active, status: "suspended" as const };
    expect(checkAccess(suspended)).toEqual({ ok: false, code: "FORBIDDEN" });
    expect(checkAccess(suspended, { allowSuspended: true }).ok).toBe(true);
  });

  it("réserve l'administration au rôle admin relu en base", () => {
    expect(checkAccess(active, { admin: true })).toEqual({ ok: false, code: "FORBIDDEN" });
    expect(checkAccess({ ...active, role: "admin" }, { admin: true }).ok).toBe(true);
  });
});

describe("toAccount", () => {
  it("ignore une session sans profil ou au profil supprimé", () => {
    expect(toAccount("u1", null, null)).toBeNull();
    expect(toAccount("u1", null, { displayName: null, role: "user", status: "active", deletedAt: new Date() })).toBeNull();
  });

  it("reprend rôle et statut du profil", () => {
    expect(toAccount("u1", "a@example.com", { displayName: "Ana", role: "admin", status: "active", deletedAt: null })).toEqual({
      id: "u1",
      email: "a@example.com",
      displayName: "Ana",
      role: "admin",
      status: "active",
    });
  });
});
