"use server";

import type { FormState } from "@/schemas/auth";
import { authContext, authDeps } from "@/server/auth/auth-deps";
import {
  requestPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  startGoogleSignIn,
  updatePassword,
} from "@/server/auth/auth-service";

// Server Actions des formulaires de compte (U04) : aucune logique ici, tout est dans src/server/auth.
// Next vérifie l'en-tête Origin de chaque Server Action (protection CSRF).

export async function signUpAction(_previous: FormState, form: FormData): Promise<FormState> {
  return signUpWithEmail(form, await authContext(), authDeps());
}

export async function signInAction(_previous: FormState, form: FormData): Promise<FormState> {
  return signInWithEmail(form, await authContext(), authDeps());
}

export async function googleSignInAction(_previous: FormState, form: FormData): Promise<FormState> {
  return startGoogleSignIn(form, await authContext(), authDeps());
}

export async function passwordResetAction(_previous: FormState, form: FormData): Promise<FormState> {
  return requestPasswordReset(form, await authContext(), authDeps());
}

export async function newPasswordAction(_previous: FormState, form: FormData): Promise<FormState> {
  return updatePassword(form, authDeps());
}
