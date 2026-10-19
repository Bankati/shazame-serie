import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ACCOUNT_TEXT } from "@/content/fr/account";
import type { Account } from "@/server/auth/guards";

import { type AccountDeps, handleAvatarDelete, handleAvatarUpload, renameAccount } from "./account-requests";
import type { AvatarStore } from "./profile-service";

const ACCOUNT: Account = { id: "8b1f3c1e-0000-4000-8000-000000000001", email: "a@example.com", displayName: "Ana", role: "user", status: "active" };
const ORIGIN = { origin: "https://site.example", host: "site.example" };

const store: AvatarStore = {
  upload: vi.fn(async () => {}),
  remove: vi.fn(async () => {}),
  signedUrl: vi.fn(async (path: string) => `https://stockage.example/${path}?jeton=1`),
};

function deps(overrides: Partial<AccountDeps> = {}): AccountDeps & { replace: ReturnType<typeof vi.fn>; rename: ReturnType<typeof vi.fn> } {
  return {
    account: async () => ACCOUNT,
    store: () => store,
    replace: vi.fn(async (_store: AvatarStore, userId: string) => `${userId}/nouvelle.webp`),
    remove: vi.fn(async () => {}),
    rename: vi.fn(async () => {}),
    ...overrides,
  } as AccountDeps & { replace: ReturnType<typeof vi.fn>; rename: ReturnType<typeof vi.fn> };
}

async function upload(file: Blob | string, headers: Record<string, string> = ORIGIN): Promise<Request> {
  const body = new FormData();
  body.append("avatar", file);
  return new Request("https://site.example/api/account/avatar", { method: "POST", headers, body });
}

const png = () => sharp({ create: { width: 300, height: 300, channels: 3, background: "#123456" } }).png().toBuffer();

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe("POST /api/account/avatar", () => {
  it("enregistre la photo réencodée sous le dossier du compte de la session, jamais un autre", async () => {
    const d = deps();
    const response = await handleAvatarUpload(await upload(new Blob([new Uint8Array(await png())], { type: "image/png" })), d);
    expect(response.status).toBe(200);
    expect((await response.json()).data.avatarUrl).toContain(`${ACCOUNT.id}/nouvelle.webp`);
    const [, userId, image] = d.replace.mock.calls[0] as [AvatarStore, string, Buffer];
    expect(userId).toBe(ACCOUNT.id);
    expect((await sharp(image).metadata()).format).toBe("webp");
  });

  it("autre origine : 403 avant toute lecture du compte", async () => {
    const account = vi.fn(async () => ACCOUNT);
    const response = await handleAvatarUpload(await upload(new Blob(["x"]), { origin: "https://evil.example", host: "site.example" }), deps({ account }));
    expect(response.status).toBe(403);
    expect(account).not.toHaveBeenCalled();
  });

  it("fichier qui n'est pas une image : message clair, rien n'est enregistré", async () => {
    const d = deps();
    const response = await handleAvatarUpload(await upload(new Blob(["pas une image"], { type: "image/jpeg" })), d);
    expect(response.status).toBe(400);
    expect((await response.json()).error).toMatchObject({ code: "VALIDATION_ERROR", message: ACCOUNT_TEXT.avatar.errors.unsupported });
    expect(d.replace).not.toHaveBeenCalled();
  });

  it("taille annoncée trop grande : refus immédiat, sans lire le corps", async () => {
    const request = new Request("https://site.example/api/account/avatar", {
      method: "POST",
      headers: { ...ORIGIN, "content-length": String(10 * 1024 * 1024) },
      body: "x",
    });
    expect((await (await handleAvatarUpload(request, deps())).json()).error.message).toBe(ACCOUNT_TEXT.avatar.errors.too_large);
  });

  it("visiteur : 401 ; compte suspendu : ACCOUNT_SUSPENDED", async () => {
    const file = new Blob([new Uint8Array(await png())], { type: "image/png" });
    expect((await handleAvatarUpload(await upload(file), deps({ account: async () => null }))).status).toBe(401);
    const suspended = await handleAvatarUpload(await upload(file), deps({ account: async () => ({ ...ACCOUNT, status: "suspended" }) }));
    expect((await suspended.json()).error.code).toBe("ACCOUNT_SUSPENDED");
  });
});

describe("DELETE /api/account/avatar", () => {
  it("retire la photo du seul compte de la session", async () => {
    const d = deps();
    const response = await handleAvatarDelete(new Request("https://site.example/api/account/avatar", { method: "DELETE", headers: ORIGIN }), d);
    expect((await response.json()).data).toEqual({ avatarUrl: null });
    expect(d.remove).toHaveBeenCalledWith(store, ACCOUNT.id);
  });
});

describe("renameAccount", () => {
  const form = (value: string) => {
    const data = new FormData();
    data.set("displayName", value);
    return data;
  };

  it("enregistre un nom nettoyé pour le compte de la session", async () => {
    const d = deps();
    expect(await renameAccount(form("  Ana   Diallo  "), d)).toEqual({ status: "success", message: ACCOUNT_TEXT.name.saved });
    expect(d.rename).toHaveBeenCalledWith(ACCOUNT.id, "Ana Diallo");
  });

  it.each(["", "   ", "x".repeat(81)])("refuse un nom vide ou trop long (%j)", async (value) => {
    const d = deps();
    expect((await renameAccount(form(value), d)).status).toBe("error");
    expect(d.rename).not.toHaveBeenCalled();
  });

  it("compte suspendu : refusé", async () => {
    const d = deps({ account: async () => ({ ...ACCOUNT, status: "suspended" }) });
    expect(await renameAccount(form("Ana"), d)).toEqual({ status: "error", message: ACCOUNT_TEXT.name.suspended });
  });
});
