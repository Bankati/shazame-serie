import type { Metadata } from "next";

import { AuthCard, AuthDivider, AuthFooterLink } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { AUTH_TEXT } from "@/content/fr/auth";

import { googleSignInAction, signUpAction } from "../actions";

export const metadata: Metadata = { title: AUTH_TEXT.signUp.metaTitle };

// CDC 13.2, étape 1 : choix entre email et Google, liens vers les conditions et la confidentialité.
export default function SignUpPage() {
  const { signUp } = AUTH_TEXT;

  return (
    <AuthCard title={signUp.title} description={signUp.description}>
      <GoogleButton action={googleSignInAction} />
      <AuthDivider label={AUTH_TEXT.divider} />
      <SignUpForm action={signUpAction} />
      <AuthFooterLink prompt={signUp.haveAccount} href="/connexion" label={signUp.signInLink} />
    </AuthCard>
  );
}
