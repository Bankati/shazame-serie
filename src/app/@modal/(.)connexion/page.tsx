import { AuthDialog } from "@/components/auth/auth-dialog";
import { SignInPanel } from "@/components/auth/auth-panels";
import { AUTH_TEXT } from "@/content/fr/auth";
import { getCurrentAccount } from "@/server/auth/guards";
import { safeNextPath } from "@/server/auth/redirect";

// Connexion en fenêtre (U41, AD-47) : interception de `/connexion` lors d'une navigation dans le site. La page
// complète `/connexion` reste servie pour un lien direct ou un rechargement.
export default async function SignInModal({ searchParams }: PageProps<"/connexion">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.suite === "string" ? params.suite : undefined, "");
  const signedIn = (await getCurrentAccount()) !== null;
  const { signIn } = AUTH_TEXT;

  return (
    <AuthDialog title={signIn.title} description={signIn.description}>
      <SignInPanel next={next || undefined} signedIn={signedIn} />
    </AuthDialog>
  );
}
