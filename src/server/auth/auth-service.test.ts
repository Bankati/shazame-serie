import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AUTH_TEXT } from "@/content/fr/auth";

import { createMemoryLimiter, LOGIN_ATTEMPTS_PER_HOUR } from "./auth-rate-limit";
import {
  type AuthClient,
  type AuthDeps,
  completeGoogleSignIn,
  confirmEmailLink,
  requestPasswordReset,
  signInWithEmail,
  signOut,
  signUpWithEmail,
  startGoogleSignIn,
  updatePassword,
} from "./auth-service";

const CTX = { ip: "203.0.113.7", origin: "https://site.example" };
const HOUR = 60 * 60 * 1000;
const realUser = { id: "8b1f3c1e-0000-4000-8000-000000000001", identities: [{}], user_metadata: {} };

function fakeAuth(overrides: Partial<Record<keyof AuthClient, unknown>> = {}): AuthClient {
  const ok = { data: { user: realUser }, error: null };
  return {
    signUp: vi.fn(async () => ok),
    signInWithPassword: vi.fn(async () => ok),
    signInWithOAuth: vi.fn(async () => ({ data: { url: "https://accounts.google.com/o/oauth2/auth?x=1" }, error: null })),
    resetPasswordForEmail: vi.fn(async () => ({ error: null })),
    verifyOtp: vi.fn(async () => ok),
    exchangeCodeForSession: vi.fn(async () => ok),
    getUser: vi.fn(async () => ok),
    updateUser: vi.fn(async () => ({ error: null })),
    signOut: vi.fn(async () => ({ error: null })),
    ...overrides,
  } as AuthClient;
}

function deps(auth: AuthClient = fakeAuth(), created = true): AuthDeps & { ensureAccount: ReturnType<typeof vi.fn> } {
  return {
    auth: async () => auth,
    ensureAccount: vi.fn(async () => ({ created })),
    loginLimiter: createMemoryLimiter(LOGIN_ATTEMPTS_PER_HOUR, HOUR),
    emailLimiter: createMemoryLimiter(5, HOUR),
  };
}

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const SIGN_UP = { email: "  Ana@Example.COM ", password: "motdepasse", accept: "on" };

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("signUpWithEmail", () => {
  it("crée le compte, le profil et les consentements, avec le lien de confirmation du site", async () => {
    const auth = fakeAuth();
    const d = deps(auth);
    const state = await signUpWithEmail(form(SIGN_UP), CTX, d);
    expect(state).toEqual({ status: "success", message: AUTH_TEXT.signUp.success });
    expect(auth.signUp).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "motdepasse",
      options: { emailRedirectTo: "https://site.example/auth/confirm" },
    });
    expect(d.ensureAccount).toHaveBeenCalledWith({ userId: realUser.id, displayName: null });
  });

  it("refuse un mot de passe de 7 caractères et une case non cochée, sans appeler Supabase", async () => {
    const auth = fakeAuth();
    const state = await signUpWithEmail(form({ email: "ana@example.com", password: "1234567" }), CTX, deps(auth));
    expect(state).toMatchObject({
      status: "error",
      fields: { password: AUTH_TEXT.errors.password, accept: AUTH_TEXT.errors.accept },
      email: "ana@example.com",
    });
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("refuse un mot de passe de plus de 72 octets (bcrypt tronquerait)", async () => {
    const state = await signUpWithEmail(form({ ...SIGN_UP, password: "é".repeat(37) }), CTX, deps());
    expect(state).toMatchObject({ status: "error", fields: { password: AUTH_TEXT.errors.password } });
  });

  it("adresse déjà inscrite : même réponse, aucun profil créé", async () => {
    const auth = fakeAuth({ signUp: vi.fn(async () => ({ data: { user: { id: "fake", identities: [] } }, error: null })) });
    const d = deps(auth);
    expect(await signUpWithEmail(form(SIGN_UP), CTX, d)).toEqual({ status: "success", message: AUTH_TEXT.signUp.success });
    expect(d.ensureAccount).not.toHaveBeenCalled();
  });

  it("panne de la base après l'inscription : succès quand même (profil rattrapé à la confirmation)", async () => {
    const d = deps();
    d.ensureAccount.mockRejectedValueOnce(new Error("timeout"));
    expect((await signUpWithEmail(form(SIGN_UP), CTX, d)).status).toBe("success");
  });

  it("6e envoi d'email en une heure depuis la même adresse IP : refusé", async () => {
    const d = deps();
    for (let i = 0; i < 5; i++) await signUpWithEmail(form(SIGN_UP), CTX, d);
    const state = await signUpWithEmail(form(SIGN_UP), CTX, d);
    expect(state).toMatchObject({ status: "error", message: expect.stringContaining("Trop de tentatives") });
  });
});

describe("signInWithEmail", () => {
  it("connecte et redirige vers la page demandée (chemin interne seulement)", async () => {
    const d = deps();
    const inside = await signInWithEmail(form({ email: "ana@example.com", password: "x", next: "/titre/film/603-matrix" }), CTX, d);
    expect(inside).toEqual({ status: "redirect", to: "/titre/film/603-matrix" });
    const outside = await signInWithEmail(form({ email: "ana@example.com", password: "x", next: "//evil.example" }), CTX, d);
    expect(outside).toEqual({ status: "redirect", to: "/" });
  });

  it("identifiants refusés : message générique, adresse conservée dans le formulaire", async () => {
    const auth = fakeAuth({
      signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: { code: "invalid_credentials", status: 400, message: "x" } })),
    });
    expect(await signInWithEmail(form({ email: "ana@example.com", password: "faux" }), CTX, deps(auth))).toEqual({
      status: "error",
      message: AUTH_TEXT.errors.invalidCredentials,
      email: "ana@example.com",
    });
  });

  it("email non confirmé : invite à cliquer sur le lien", async () => {
    const auth = fakeAuth({
      signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: { code: "email_not_confirmed", status: 400, message: "x" } })),
    });
    const state = await signInWithEmail(form({ email: "ana@example.com", password: "x" }), CTX, deps(auth));
    expect(state).toMatchObject({ status: "error", message: AUTH_TEXT.errors.emailNotConfirmed });
  });

  it("la 21e tentative de connexion en une heure est refusée, sans appeler Supabase (critère U04)", async () => {
    const auth = fakeAuth({
      signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: { code: "invalid_credentials", status: 400, message: "x" } })),
    });
    const d = deps(auth);
    for (let attempt = 1; attempt <= 20; attempt++) {
      const state = await signInWithEmail(form({ email: "ana@example.com", password: `essai-${attempt}` }), CTX, d);
      expect(state).toMatchObject({ message: AUTH_TEXT.errors.invalidCredentials });
    }
    const refused = await signInWithEmail(form({ email: "ana@example.com", password: "le-bon" }), CTX, d);
    expect(refused).toEqual({ status: "error", message: AUTH_TEXT.errors.rateLimited(60) });
    expect(auth.signInWithPassword).toHaveBeenCalledTimes(20);
  });

  it("le journal ne contient ni l'email ni le mot de passe", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const auth = fakeAuth({
      signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: { code: "unexpected_failure", status: 500, message: "boom" } })),
    });
    await signInWithEmail(form({ email: "secret@example.com", password: "motdepasse-secret" }), CTX, deps(auth));
    const logged = warn.mock.calls.flat().join(" ");
    expect(logged).toContain("auth.signin_failed");
    expect(logged).not.toMatch(/secret@example\.com|motdepasse-secret/);
  });
});

describe("liens reçus par email", () => {
  const link = (query: string) => new URL(`https://site.example/auth/confirm?${query}`);

  it("confirmation d'inscription : profil assuré puis écran de bienvenue", async () => {
    const d = deps();
    expect(await confirmEmailLink(link("token_hash=abcdef123456&type=email"), d)).toBe("/bienvenue");
    expect(d.ensureAccount).toHaveBeenCalled();
  });

  it("réinitialisation : page du nouveau mot de passe", async () => {
    expect(await confirmEmailLink(link("token_hash=abcdef123456&type=recovery"), deps())).toBe("/mot-de-passe/nouveau");
  });

  it("lien déjà utilisé ou expiré : retour à la connexion avec un message (usage unique, RG10)", async () => {
    const auth = fakeAuth({ verifyOtp: vi.fn(async () => ({ data: { user: null }, error: { code: "otp_expired", status: 403, message: "x" } })) });
    expect(await confirmEmailLink(link("token_hash=abcdef123456&type=recovery"), deps(auth))).toBe("/connexion?erreur=lien");
  });

  it("paramètres invalides : aucun appel à Supabase", async () => {
    const auth = fakeAuth();
    expect(await confirmEmailLink(link("token_hash=x&type=magiclink"), deps(auth))).toBe("/connexion?erreur=lien");
    expect(auth.verifyOtp).not.toHaveBeenCalled();
  });
});

describe("Google", () => {
  it("démarre vers l'adresse fournie par Supabase, retour sur /auth/callback avec la page demandée", async () => {
    const auth = fakeAuth();
    const state = await startGoogleSignIn(form({ next: "/titre/film/603-matrix" }), CTX, deps(auth));
    expect(state).toEqual({ status: "redirect", to: "https://accounts.google.com/o/oauth2/auth?x=1" });
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://site.example/auth/callback?next=%2Ftitre%2Ffilm%2F603-matrix" },
    });
  });

  it("nouveau compte : bienvenue ; compte existant : page demandée ; échec : connexion", async () => {
    const callback = (query: string) => new URL(`https://site.example/auth/callback?${query}`);
    expect(await completeGoogleSignIn(callback("code=abc&next=/titre/film/1"), deps(fakeAuth(), true))).toBe("/bienvenue");
    expect(await completeGoogleSignIn(callback("code=abc&next=/titre/film/1"), deps(fakeAuth(), false))).toBe("/titre/film/1");
    expect(await completeGoogleSignIn(callback("error=access_denied"), deps())).toBe("/connexion?erreur=google");
  });

  it("reprend le nom fourni par Google", async () => {
    const auth = fakeAuth({
      exchangeCodeForSession: vi.fn(async () => ({ data: { user: { ...realUser, user_metadata: { full_name: "Ana Diallo" } } }, error: null })),
    });
    const d = deps(auth);
    await completeGoogleSignIn(new URL("https://site.example/auth/callback?code=abc"), d);
    expect(d.ensureAccount).toHaveBeenCalledWith({ userId: realUser.id, displayName: "Ana Diallo" });
  });
});

describe("mot de passe", () => {
  it("demande de réinitialisation : même réponse que l'adresse existe ou non", async () => {
    const auth = fakeAuth({ resetPasswordForEmail: vi.fn(async () => ({ error: { code: "user_not_found", status: 404, message: "x" } })) });
    expect(await requestPasswordReset(form({ email: "inconnu@example.com" }), CTX, deps(auth))).toEqual({
      status: "success",
      message: AUTH_TEXT.forgotPassword.success,
    });
  });

  it("nouveau mot de passe : exige une session vérifiée, puis déconnecte les autres appareils", async () => {
    const auth = fakeAuth();
    expect(await updatePassword(form({ password: "nouveau-mdp", confirmation: "nouveau-mdp" }), deps(auth))).toEqual({
      status: "success",
      message: AUTH_TEXT.newPassword.success,
    });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "others" });

    const expired = fakeAuth({ getUser: vi.fn(async () => ({ data: { user: null }, error: null })) });
    expect(await updatePassword(form({ password: "nouveau-mdp", confirmation: "nouveau-mdp" }), deps(expired))).toEqual({
      status: "error",
      message: AUTH_TEXT.errors.sessionExpired,
    });
    expect(expired.updateUser).not.toHaveBeenCalled();
  });

  it("confirmation différente : refusée", async () => {
    const state = await updatePassword(form({ password: "nouveau-mdp", confirmation: "autre-mdp" }), deps());
    expect(state).toMatchObject({ status: "error", fields: { confirmation: AUTH_TEXT.errors.confirmation } });
  });
});

describe("signOut", () => {
  it("révoque la session de cet appareil (RG9) et renvoie à l'accueil", async () => {
    const auth = fakeAuth();
    expect(await signOut({ auth: async () => auth })).toEqual({ status: "redirect", to: "/" });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
