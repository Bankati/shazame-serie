import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AvatarEditor } from "@/components/account/avatar-editor";
import { NameForm } from "@/components/account/name-form";
import { ACCOUNT_TEXT } from "@/content/fr/account";
import { formatParisDate } from "@/lib/paris-time";
import { loadAccountPageFor } from "@/server/account/account-requests";
import { requireUser } from "@/server/auth/guards";

import { renameAction } from "./actions";

export const metadata: Metadata = { title: ACCOUNT_TEXT.metaTitle, robots: { index: false } };

// Mon compte (U05, CDC 12.4) : session vérifiée avant toute lecture (invariant 7). Un compte suspendu voit
// son profil ; les modifications sont refusées par le serveur.
export default async function AccountPage() {
  const access = await requireUser({ allowSuspended: true });
  if (!access.ok) {
    redirect("/connexion?suite=/compte");
  }
  const { account } = access;
  const { displayName: name, createdAt, avatarUrl } = await loadAccountPageFor(account.id);
  const initial = (name || account.email || "?").charAt(0).toLocaleUpperCase("fr");
  const text = ACCOUNT_TEXT;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-display font-bold md:text-display-lg">{text.title}</h1>
        <p className="text-base text-muted-foreground">{text.description}</p>
        {createdAt ? <p className="text-sm text-muted-foreground">{text.memberSince(formatParisDate(createdAt))}</p> : null}
      </div>

      <section aria-labelledby="photo-titre" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:p-6">
        <h2 id="photo-titre" className="text-lg font-semibold text-foreground">
          {text.avatar.title}
        </h2>
        <AvatarEditor initialUrl={avatarUrl} initial={initial} />
      </section>

      <section aria-labelledby="nom-titre" className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 md:p-6">
        <h2 id="nom-titre" className="text-lg font-semibold text-foreground">
          {text.name.title}
        </h2>
        <NameForm action={renameAction} defaultName={name} />
        {account.email ? (
          <dl className="flex flex-col gap-1 border-t border-border pt-4">
            <dt className="text-sm text-muted-foreground">{text.email}</dt>
            <dd className="text-base text-foreground">{account.email}</dd>
          </dl>
        ) : null}
      </section>
    </div>
  );
}
