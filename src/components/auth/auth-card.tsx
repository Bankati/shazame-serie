import Link from "next/link";

// Carte des pages de compte : colonne unique et étroite (ui-context.md, « Compte »).
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold">{title}</h1>
        {description ? <p className="text-base text-muted-foreground">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-6 rounded-lg border border-border bg-card p-4 md:p-6">{children}</div>
    </div>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
      <span>{label}</span>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}

/** Lien de bas de carte (« Vous avez déjà un compte ? Se connecter »). */
export function AuthFooterLink({ prompt, href, label }: { prompt?: string; href: string; label: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      {prompt ? `${prompt} ` : null}
      <Link
        href={href}
        className="font-medium text-link underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
      >
        {label}
      </Link>
    </p>
  );
}

/** Message affiché en tête de carte après une redirection (lien expiré, échec Google…). */
export function AuthNotice({ message }: { message: string }) {
  return (
    <p role="alert" className="rounded-md border border-border bg-muted p-3 text-sm text-foreground">
      {message}
    </p>
  );
}
