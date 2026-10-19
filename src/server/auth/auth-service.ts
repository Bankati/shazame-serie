import "server-only";

import type { z } from "zod";

import { AUTH_TEXT } from "@/content/fr/auth";
import {
  emailLinkSchema,
  type FormState,
  googleInputSchema,
  newPasswordInputSchema,
  passwordResetInputSchema,
  signInInputSchema,
  signUpInputSchema,
} from "@/schemas/auth";
import type { RateLimitResult } from "@/server/http/rate-limit";
import { log } from "@/server/log";

import type { AttemptLimiter } from "./auth-rate-limit";
import { safeNextPath } from "./redirect";

// Logique des Server Actions et des retours d'email / de Google (U04). Les fichiers de `src/app` ne font que
// lire la requête, appeler ces fonctions et rediriger. Dépendances injectées : testées sans Supabase.
//
// Ordre fixe (code-standards.md) : limitation de débit, validation zod, appel à Supabase Auth, réponse.
// Jamais d'email, de mot de passe ni de jeton dans les journaux : seulement le code d'erreur Supabase.

type AuthErrorLike = { code?: string; status?: number; message: string } | null;
type UserLike = { id: string; identities?: unknown[] | null; user_metadata?: Record<string, unknown> };

/** Sous-ensemble de `SupabaseClient["auth"]` utilisé ici (le vrai client y est conforme). */
export interface AuthClient {
  signUp(credentials: {
    email: string;
    password: string;
    options: { emailRedirectTo: string };
  }): Promise<{ data: { user: UserLike | null }; error: AuthErrorLike }>;
  signInWithPassword(credentials: { email: string; password: string }): Promise<{
    data: { user: UserLike | null };
    error: AuthErrorLike;
  }>;
  signInWithOAuth(credentials: {
    provider: "google";
    options: { redirectTo: string };
  }): Promise<{ data: { url: string | null }; error: AuthErrorLike }>;
  resetPasswordForEmail(email: string, options: { redirectTo: string }): Promise<{ error: AuthErrorLike }>;
  verifyOtp(params: { token_hash: string; type: "email" | "signup" | "recovery" }): Promise<{
    data: { user: UserLike | null };
    error: AuthErrorLike;
  }>;
  exchangeCodeForSession(code: string): Promise<{ data: { user: UserLike | null }; error: AuthErrorLike }>;
  getUser(): Promise<{ data: { user: UserLike | null }; error: AuthErrorLike }>;
  updateUser(attributes: { password: string }): Promise<{ error: AuthErrorLike }>;
  signOut(options: { scope: "local" | "others" }): Promise<{ error: AuthErrorLike }>;
}

export type AuthDeps = {
  auth: () => Promise<AuthClient>;
  ensureAccount: (input: { userId: string; displayName: string | null }) => Promise<{ created: boolean }>;
  loginLimiter: AttemptLimiter;
  emailLimiter: AttemptLimiter;
  now?: () => number;
};

/** Adresse IP (limitation de débit) et origine publique du site (liens des emails, retour de Google). */
export type AuthContext = { ip: string; origin: string };

const { errors } = AUTH_TEXT;

export const WELCOME_PATH = "/bienvenue";
export const NEW_PASSWORD_PATH = "/mot-de-passe/nouveau";
export const SIGN_IN_PATH = "/connexion";

// --- Inscription ---------------------------------------------------------------------------------------

export async function signUpWithEmail(form: FormData, ctx: AuthContext, deps: AuthDeps): Promise<FormState> {
  const limited = await rateLimited(deps.emailLimiter, `email:${ctx.ip}`, deps);
  if (limited) return limited;

  const input = signUpInputSchema.safeParse(read(form, ["email", "password", "accept"]));
  if (!input.success) {
    return invalid(input.error, { email: errors.email, password: errors.password, accept: errors.accept }, form);
  }

  const auth = await deps.auth();
  const { data, error } = await auth.signUp({
    email: input.data.email,
    password: input.data.password,
    options: { emailRedirectTo: `${ctx.origin}/auth/confirm` },
  });
  if (error) {
    // Adresse déjà inscrite (quand Supabase le signale) : même réponse qu'une inscription, pour ne pas
    // révéler quelles adresses ont un compte.
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return { status: "success", message: AUTH_TEXT.signUp.success };
    }
    return authFailure("auth.signup_failed", error, input.data.email);
  }

  // Adresse déjà inscrite : Supabase renvoie un utilisateur factice sans identité. Aucun profil à créer.
  const user = data.user;
  if (user && (user.identities?.length ?? 0) > 0) {
    try {
      await deps.ensureAccount({ userId: user.id, displayName: null });
    } catch {
      // Le profil sera créé à la confirmation (même appel, idempotent).
      log.error("auth.profile_create_failed", { step: "signup" });
    }
  }
  return { status: "success", message: AUTH_TEXT.signUp.success };
}

// --- Connexion -----------------------------------------------------------------------------------------

export async function signInWithEmail(form: FormData, ctx: AuthContext, deps: AuthDeps): Promise<FormState> {
  const limited = await rateLimited(deps.loginLimiter, `login:${ctx.ip}`, deps);
  if (limited) return limited;

  const input = signInInputSchema.safeParse(read(form, ["email", "password", "next"]));
  if (!input.success) {
    return invalid(input.error, { email: errors.email, password: errors.passwordRequired }, form);
  }

  const auth = await deps.auth();
  const { data, error } = await auth.signInWithPassword({ email: input.data.email, password: input.data.password });
  if (error) {
    if (error.code === "invalid_credentials") {
      return { status: "error", message: errors.invalidCredentials, email: input.data.email };
    }
    if (error.code === "email_not_confirmed") {
      return { status: "error", message: errors.emailNotConfirmed, email: input.data.email };
    }
    return authFailure("auth.signin_failed", error, input.data.email);
  }

  // Compte créé avant une panne de la base : on rattrape le profil (sans effet s'il existe).
  if (data.user) {
    await ensureAccountQuietly(deps, data.user, "signin");
  }
  return { status: "redirect", to: safeNextPath(input.data.next) };
}

export async function startGoogleSignIn(form: FormData, ctx: AuthContext, deps: AuthDeps): Promise<FormState> {
  const limited = await rateLimited(deps.loginLimiter, `login:${ctx.ip}`, deps);
  if (limited) return limited;

  const input = googleInputSchema.safeParse(read(form, ["next"]));
  const next = safeNextPath(input.success ? input.data.next : undefined);

  const auth = await deps.auth();
  const callback = new URL("/auth/callback", ctx.origin);
  if (next !== "/") callback.searchParams.set("next", next);
  const { data, error } = await auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.toString() } });
  if (error || !data.url) {
    log.warn("auth.google_start_failed", { code: error?.code ?? "no_url" });
    return { status: "error", message: AUTH_TEXT.google.unavailable };
  }
  return { status: "redirect", to: data.url };
}

/** Retour de Google (`/auth/callback?code=…`). Nouveau compte → écran de bienvenue. */
export async function completeGoogleSignIn(url: URL, deps: AuthDeps): Promise<string> {
  const code = url.searchParams.get("code");
  if (!code || code.length > 512) {
    log.warn("auth.google_callback_failed", { code: url.searchParams.get("error") ?? "no_code" });
    return `${SIGN_IN_PATH}?erreur=google`;
  }
  const auth = await deps.auth();
  const { data, error } = await auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    log.warn("auth.google_callback_failed", { code: error?.code ?? "no_user" });
    return `${SIGN_IN_PATH}?erreur=google`;
  }
  // Accepter les textes : mention affichée à côté du bouton « Continuer avec Google » (décision 4).
  const created = await ensureAccountQuietly(deps, data.user, "google");
  return created ? WELCOME_PATH : safeNextPath(url.searchParams.get("next"));
}

/** Lien reçu par email (`/auth/confirm?token_hash=…&type=…`). Usage unique : Supabase invalide le jeton. */
export async function confirmEmailLink(url: URL, deps: AuthDeps): Promise<string> {
  const input = emailLinkSchema.safeParse({
    token_hash: url.searchParams.get("token_hash"),
    type: url.searchParams.get("type"),
  });
  if (!input.success) {
    return `${SIGN_IN_PATH}?erreur=lien`;
  }
  const auth = await deps.auth();
  const { data, error } = await auth.verifyOtp(input.data);
  if (error || !data.user) {
    log.info("auth.email_link_rejected", { type: input.data.type, code: error?.code ?? "no_user" });
    return `${SIGN_IN_PATH}?erreur=lien`;
  }
  if (input.data.type === "recovery") {
    return NEW_PASSWORD_PATH;
  }
  await ensureAccountQuietly(deps, data.user, "confirm");
  return WELCOME_PATH;
}

// --- Mot de passe oublié -------------------------------------------------------------------------------

export async function requestPasswordReset(form: FormData, ctx: AuthContext, deps: AuthDeps): Promise<FormState> {
  const limited = await rateLimited(deps.emailLimiter, `email:${ctx.ip}`, deps);
  if (limited) return limited;

  const input = passwordResetInputSchema.safeParse(read(form, ["email"]));
  if (!input.success) {
    return invalid(input.error, { email: errors.email }, form);
  }

  const auth = await deps.auth();
  const { error } = await auth.resetPasswordForEmail(input.data.email, { redirectTo: `${ctx.origin}/auth/confirm` });
  if (error?.code === "over_email_send_rate_limit" || error?.status === 429) {
    return { status: "error", message: errors.rateLimited(60), email: input.data.email };
  }
  if (error) {
    log.warn("auth.reset_request_failed", { code: error.code ?? "unknown" });
  }
  // Même réponse que l'adresse existe ou non (pas d'énumération des comptes).
  return { status: "success", message: AUTH_TEXT.forgotPassword.success };
}

export async function updatePassword(form: FormData, deps: AuthDeps): Promise<FormState> {
  const input = newPasswordInputSchema.safeParse(read(form, ["password", "confirmation"]));
  if (!input.success) {
    return invalid(input.error, { password: errors.password, confirmation: errors.confirmation });
  }

  const auth = await deps.auth();
  // Opération sensible : session vérifiée auprès de Supabase (getUser), pas seulement le jeton (AD-34).
  const { data } = await auth.getUser();
  if (!data.user) {
    return { status: "error", message: errors.sessionExpired };
  }
  const { error } = await auth.updateUser({ password: input.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { status: "error", message: errors.samePassword, fields: { password: errors.samePassword } };
    }
    if (error.code === "weak_password") {
      return { status: "error", message: errors.weakPassword, fields: { password: errors.weakPassword } };
    }
    log.warn("auth.password_update_failed", { code: error.code ?? "unknown" });
    return { status: "error", message: errors.unexpected };
  }
  // Les autres appareils perdent leur session : le mot de passe a pu être changé après une fuite.
  const others = await auth.signOut({ scope: "others" });
  if (others.error) {
    log.warn("auth.signout_others_failed", { code: others.error.code ?? "unknown" });
  }
  return { status: "success", message: AUTH_TEXT.newPassword.success };
}

// --- Déconnexion ---------------------------------------------------------------------------------------

/** RG9 : la déconnexion révoque le jeton de rafraîchissement de cette session et efface les cookies. */
export async function signOut(deps: Pick<AuthDeps, "auth">): Promise<FormState> {
  const auth = await deps.auth();
  const { error } = await auth.signOut({ scope: "local" });
  if (error) {
    log.warn("auth.signout_failed", { code: error.code ?? "unknown" });
  }
  return { status: "redirect", to: "/" };
}

// --- Utilitaires ---------------------------------------------------------------------------------------

function read(form: FormData, keys: readonly string[]): Record<string, string | undefined> {
  const values: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = form.get(key);
    values[key] = typeof value === "string" ? value : undefined;
  }
  return values;
}

async function rateLimited(limiter: AttemptLimiter, key: string, deps: AuthDeps): Promise<FormState | null> {
  const result: RateLimitResult = await limiter.consume(key);
  if (result.ok) {
    return null;
  }
  const now = deps.now?.() ?? Date.now();
  const minutes = Math.max(1, Math.ceil((result.retryAt.getTime() - now) / 60_000));
  log.info("auth.rate_limited");
  return { status: "error", message: errors.rateLimited(minutes) };
}

function invalid(error: z.ZodError, messages: Record<string, string>, form?: FormData): FormState {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (messages[key] && !fields[key]) {
      fields[key] = messages[key];
    }
  }
  const email = form?.get("email");
  return {
    status: "error",
    message: Object.values(fields)[0] ?? errors.unexpected,
    fields,
    email: typeof email === "string" ? email.slice(0, 254) : undefined,
  };
}

function authFailure(event: string, error: NonNullable<AuthErrorLike>, email: string): FormState {
  if (error.code === "weak_password") {
    return { status: "error", message: errors.weakPassword, fields: { password: errors.weakPassword }, email };
  }
  // Préproduction sans SMTP personnalisé : Supabase n'écrit qu'aux membres de l'organisation (Q11).
  if (error.code === "email_address_not_authorized") {
    return { status: "error", message: errors.notAuthorized, email };
  }
  if (error.code === "email_address_invalid") {
    return { status: "error", message: errors.email, fields: { email: errors.email }, email };
  }
  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit" || error.status === 429) {
    return { status: "error", message: errors.rateLimited(60), email };
  }
  log.warn(event, { code: error.code ?? "unknown", status: error.status ?? 0 });
  return { status: "error", message: errors.unexpected, email };
}

/** Crée le profil s'il manque. Renvoie true si le compte vient d'être créé ; une panne n'empêche pas la connexion. */
async function ensureAccountQuietly(deps: AuthDeps, user: UserLike, step: string): Promise<boolean> {
  try {
    const { created } = await deps.ensureAccount({ userId: user.id, displayName: displayNameOf(user) });
    return created;
  } catch {
    log.error("auth.profile_create_failed", { step });
    return false;
  }
}

// Google fournit `full_name` (ou `name`) dans les métadonnées de l'utilisateur.
function displayNameOf(user: UserLike): string | null {
  const metadata = user.user_metadata ?? {};
  const name = metadata.full_name ?? metadata.name;
  return typeof name === "string" ? name : null;
}
