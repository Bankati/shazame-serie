import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard, AuthNotice } from "@/components/auth/auth-card";
import { NewPasswordForm } from "@/components/auth/new-password-form";
import { Button } from "@/components/ui/button";
import { AUTH_TEXT } from "@/content/fr/auth";
import { getCurrentAccount } from "@/server/auth/guards";

import { newPasswordAction } from "../../actions";

export const metadata: Metadata = { title: AUTH_TEXT.newPassword.metaTitle, robots: { index: false } };

// Atteinte par le lien de réinitialisation : /auth/confirm a ouvert la session (lien à usage unique).
export default async function NewPasswordPage() {
  const { newPassword } = AUTH_TEXT;
  const account = await getCurrentAccount();

  return (
    <AuthCard title={newPassword.title} description={account ? newPassword.description : undefined}>
      {account ? (
        <NewPasswordForm action={newPasswordAction} />
      ) : (
        <>
          <AuthNotice message={newPassword.expired} />
          <Button asChild variant="outline" className="h-11 w-full text-base">
            <Link href="/mot-de-passe-oublie">{newPassword.requestLink}</Link>
          </Button>
        </>
      )}
    </AuthCard>
  );
}
