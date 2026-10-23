import { googleSignInAction, signInAction, signUpAction } from "@/app/(auth)/actions";
import { AUTH_TEXT } from "@/content/fr/auth";

import { AuthDivider, AuthFooterLink, AuthNotice } from "./auth-card";
import { GoogleButton } from "./google-button";
import { SignInForm } from "./sign-in-form";
import { SignUpForm } from "./sign-up-form";

const NOTICES = AUTH_TEXT.notices;

// Contenu de connexion et d'inscription (U41), partagé par les pages `/connexion` et `/inscription` (liens directs,
// courriels) et par la fenêtre ouverte depuis le site. Mêmes Server Actions et mêmes contrôles qu'en U04.

export function SignInPanel({ next, notice, signedIn }: { next?: string; notice?: string; signedIn: boolean }) {
  const { signIn } = AUTH_TEXT;
  return (
    <>
      {signedIn ? (
        <div className="flex flex-col gap-3">
          <AuthNotice message={NOTICES.alreadySignedIn} />
          <AuthFooterLink href="/" label={NOTICES.goHome} />
        </div>
      ) : null}
      {notice && notice in NOTICES ? <AuthNotice message={NOTICES[notice as keyof typeof NOTICES]} /> : null}
      <GoogleButton action={googleSignInAction} next={next} />
      <AuthDivider label={AUTH_TEXT.divider} />
      <SignInForm action={signInAction} next={next} />
      <AuthFooterLink prompt={signIn.noAccount} href={withNext("/inscription", next)} label={signIn.signUpLink} />
    </>
  );
}

export function SignUpPanel({ next }: { next?: string }) {
  const { signUp } = AUTH_TEXT;
  return (
    <>
      <GoogleButton action={googleSignInAction} next={next} />
      <AuthDivider label={AUTH_TEXT.divider} />
      <SignUpForm action={signUpAction} />
      <AuthFooterLink prompt={signUp.haveAccount} href={withNext("/connexion", next)} label={signUp.signInLink} />
    </>
  );
}

/** Garde la page de retour quand on passe de la connexion à l'inscription (et inversement). */
function withNext(path: string, next?: string): string {
  return next ? `${path}?suite=${encodeURIComponent(next)}` : path;
}
