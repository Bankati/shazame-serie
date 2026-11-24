import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInPanel } from "@/components/auth/auth-panels";
import { AUTH_TEXT } from "@/content/fr/auth";
import { getCurrentAccount } from "@/server/auth/guards";
import { safeNextPath } from "@/server/auth/redirect";

export const metadata: Metadata = { title: AUTH_TEXT.signIn.metaTitle, robots: { index: false } };

// Page complète (liens directs, courriels, redirections serveur) ; depuis le site, la même connexion s'ouvre en
// fenêtre (`@modal/(.)connexion`, U41).
// Pas de redirection si une session existe : la page est re-rendue par la Server Action de connexion, et
// une redirection serveur à ce moment empêcherait le navigateur de recharger le compte (constaté en U04).
// Un avis l'indique à la place ; le formulaire reste monté pour finir la redirection en cours.
export default async function SignInPage({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = safeNextPath(single(params.suite), "");
  const signedIn = (await getCurrentAccount()) !== null;
  const { signIn } = AUTH_TEXT;

  return (
    <AuthCard title={signIn.title} description={signIn.description}>
      <SignInPanel next={next || undefined} notice={single(params.erreur)} signedIn={signedIn} />
    </AuthCard>
  );
}

function single(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}
