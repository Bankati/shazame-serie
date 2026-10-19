import type { Metadata } from "next";

import { AuthCard, AuthFooterLink } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { AUTH_TEXT } from "@/content/fr/auth";

import { passwordResetAction } from "../actions";

export const metadata: Metadata = { title: AUTH_TEXT.forgotPassword.metaTitle, robots: { index: false } };

export default function ForgotPasswordPage() {
  const { forgotPassword } = AUTH_TEXT;
  return (
    <AuthCard title={forgotPassword.title} description={forgotPassword.description}>
      <ForgotPasswordForm action={passwordResetAction} />
      <AuthFooterLink href="/connexion" label={forgotPassword.back} />
    </AuthCard>
  );
}
