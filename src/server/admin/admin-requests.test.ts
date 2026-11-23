import { describe, expect, it, vi } from "vitest";

import type { Account } from "@/server/auth/guards";

import { type AdminDeps, changeSetting, changeUserStatus } from "./admin-requests";

const ADMIN: Account = { id: "a0000000-0000-4000-8000-000000000001", email: null, displayName: "Admin", role: "admin", status: "active" };
const USER_ID = "b0000000-0000-4000-8000-000000000002";

function deps(overrides: Partial<AdminDeps> = {}): AdminDeps {
  return {
    admin: vi.fn(async () => ADMIN),
    setStatus: vi.fn(async () => ({ ok: true as const, value: "changed" as const })),
    updateSetting: vi.fn(async () => "changed" as const),
    ...overrides,
  };
}

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

describe("changeUserStatus", () => {
  it("valide l'entrée avant de vérifier le rôle", async () => {
    const d = deps();
    const state = await changeUserStatus(form({ userId: "pas-un-uuid", status: "suspended" }), d);
    expect(state.status).toBe("error");
    expect(d.admin).not.toHaveBeenCalled();
    expect(d.setStatus).not.toHaveBeenCalled();
  });

  it("refuse un non-admin sans rien modifier", async () => {
    const d = deps({ admin: vi.fn(async () => null) });
    const state = await changeUserStatus(form({ userId: USER_ID, status: "suspended" }), d);
    expect(state.status).toBe("error");
    expect(d.setStatus).not.toHaveBeenCalled();
  });

  it("suspend au nom de l'admin de la session", async () => {
    const d = deps();
    const state = await changeUserStatus(form({ userId: USER_ID, status: "suspended" }), d);
    expect(state.status).toBe("success");
    expect(d.setStatus).toHaveBeenCalledWith(ADMIN.id, USER_ID, "suspended");
  });

  it("renvoie le motif d'un refus", async () => {
    const d = deps({ setStatus: vi.fn(async () => ({ ok: false as const, error: "admin_target" as const })) });
    const state = await changeUserStatus(form({ userId: USER_ID, status: "suspended" }), d);
    expect(state.status).toBe("error");
  });

  it("transforme une panne en message générique", async () => {
    const d = deps({ setStatus: vi.fn(async () => Promise.reject(new Error("db"))) });
    const state = await changeUserStatus(form({ userId: USER_ID, status: "active" }), d);
    expect(state).toMatchObject({ status: "error" });
  });
});

describe("changeSetting", () => {
  it("refuse une clé inconnue ou une valeur invalide sans vérifier le rôle", async () => {
    const d = deps();
    expect((await changeSetting(form({ key: "role", value: "1" }), d)).status).toBe("error");
    expect((await changeSetting(form({ key: "free_daily_quota", value: "0" }), d)).status).toBe("error");
    expect(d.admin).not.toHaveBeenCalled();
  });

  it("refuse un non-admin", async () => {
    const d = deps({ admin: vi.fn(async () => null) });
    expect((await changeSetting(form({ key: "free_daily_quota", value: "20" }), d)).status).toBe("error");
    expect(d.updateSetting).not.toHaveBeenCalled();
  });

  it("enregistre le plafond IA converti en micro-euros", async () => {
    const d = deps();
    const state = await changeSetting(form({ key: "ai_daily_cap_micro_eur", value: "12,50" }), d);
    expect(state.status).toBe("success");
    expect(d.updateSetting).toHaveBeenCalledWith(ADMIN.id, "ai_daily_cap_micro_eur", 12_500_000);
  });

  it("signale un réglage absent comme une erreur", async () => {
    const d = deps({ updateSetting: vi.fn(async () => "missing" as const) });
    expect((await changeSetting(form({ key: "free_daily_quota", value: "20" }), d)).status).toBe("error");
  });
});
