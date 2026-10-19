import { z } from "zod";

// Entrées des formulaires de compte (U04). Les mêmes bornes sont posées en HTML (type, minLength, maxLength).

export const PASSWORD_MIN = 8;
// Supabase (bcrypt) ignore tout au-delà de 72 octets : on refuse plutôt que de tronquer en silence.
export const PASSWORD_MAX = 72;
export const EMAIL_MAX = 254;

const email = z.string().trim().toLowerCase().max(EMAIL_MAX).pipe(z.email());
const newPassword = z
  .string()
  .min(PASSWORD_MIN)
  .refine((value) => new TextEncoder().encode(value).length <= PASSWORD_MAX);

export const signUpInputSchema = z.object({
  email,
  password: newPassword,
  // Case non cochée par défaut : seule la valeur « on » (case cochée) est acceptée.
  accept: z.literal("on"),
});

export const signInInputSchema = z.object({
  email,
  password: z.string().min(1).max(1024),
  next: z.string().max(512).optional(),
});

export const passwordResetInputSchema = z.object({ email });

export const newPasswordInputSchema = z
  .object({ password: newPassword, confirmation: z.string().max(1024) })
  .refine((value) => value.password === value.confirmation, { path: ["confirmation"] });

export const googleInputSchema = z.object({ next: z.string().max(512).optional() });

// Liens reçus par email (token_hash) : `email` pour la confirmation d'inscription, `recovery` pour le reset.
export const emailLinkSchema = z.object({
  token_hash: z.string().min(8).max(512),
  type: z.enum(["email", "signup", "recovery"]),
});

/**
 * État renvoyé par une Server Action de formulaire (useActionState). `redirect` : le navigateur part vers
 * la page cible et recharge le compte et le quota de l'en-tête (src/client/account/session.ts).
 */
export type FormState =
  | { status: "idle" }
  | { status: "redirect"; to: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fields?: Partial<Record<string, string>>; email?: string };

export const IDLE_FORM: FormState = { status: "idle" };
