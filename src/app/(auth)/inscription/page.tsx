import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpPanel } from "@/components/auth/auth-panels";
import { AUTH_TEXT } from "@/content/fr/auth";
import { safeNextPath } from "@/server/auth/redirect";

export const metadata: Metadata = { title: AUTH_TEXT.signUp.metaTitle };

// CDC 13.2, étape 1 : choix entre email et Google, liens vers les conditions et la confidentialité. Page complète
// pour les liens directs ; depuis le site, la même inscription s'ouvre en fenêtre (`@modal/(.)inscription`, U41).
export default async function SignUpPage({ searchParams }: PageProps<"/inscription">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.suite === "string" ? params.suite : undefined, "");
  const { signUp } = AUTH_TEXT;

  return (
    <AuthCard title={signUp.title} description={signUp.description}>
      <SignUpPanel next={next || undefined} />
    </AuthCard>
  );
}
