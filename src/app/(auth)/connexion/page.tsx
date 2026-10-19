import type { Metadata } from "next";

import { AuthCard, AuthDivider, AuthFooterLink, AuthNotice } from "@/components/auth/auth-card";
import { GoogleButton } from "@/components/auth/google-button";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AUTH_TEXT } from "@/content/fr/auth";
import { getCurrentAccount } from "@/server/auth/guards";
import { safeNextPath } from "@/server/auth/redirect";

import { googleSignInAction, signInAction } from "../actions";

export const metadata: Metadata = { title: AUTH_TEXT.signIn.metaTitle, robots: { index: false } };

const NOTICES = AUTH_TEXT.notices;

// Pas de redirection si une session existe : la page est re-rendue par la Server Action de connexion, et
// une redirection serveur à ce moment empêcherait le navigateur de recharger le compte (constaté en U04).
// Un avis l'indique à la place ; le formulaire reste monté pour finir la redirection en cours.
export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = safeNextPath(single(params.suite), "");
  const notice = single(params.erreur);
  const signedIn = (await getCurrentAccount()) !== null;
  const { signIn } = AUTH_TEXT;

  return (
    <AuthCard title={signIn.title} description={signIn.description}>
      {signedIn ? (
        <div className="flex flex-col gap-3">
          <AuthNotice message={NOTICES.alreadySignedIn} />
          <AuthFooterLink href="/" label={NOTICES.goHome} />
        </div>
      ) : null}
      {notice && notice in NOTICES ? <AuthNotice message={NOTICES[notice as keyof typeof NOTICES]} /> : null}
      <GoogleButton action={googleSignInAction} next={next || undefined} />
      <AuthDivider label={AUTH_TEXT.divider} />
      <SignInForm action={signInAction} next={next || undefined} />
      <AuthFooterLink prompt={signIn.noAccount} href="/inscription" label={signIn.signUpLink} />
    </AuthCard>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}
