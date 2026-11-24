import { AuthDialog } from "@/components/auth/auth-dialog";
import { SignUpPanel } from "@/components/auth/auth-panels";
import { AUTH_TEXT } from "@/content/fr/auth";
import { safeNextPath } from "@/server/auth/redirect";

// Inscription en fenêtre (U41, AD-47) : interception de `/inscription` lors d'une navigation dans le site.
export default async function SignUpModal({ searchParams }: PageProps<"/inscription">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.suite === "string" ? params.suite : undefined, "");
  const { signUp } = AUTH_TEXT;

  return (
    <AuthDialog title={signUp.title} description={signUp.description}>
      <SignUpPanel next={next || undefined} />
    </AuthDialog>
  );
}
