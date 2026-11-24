import { Check } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { AUTH_TEXT } from "@/content/fr/auth";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { getCurrentAccount } from "@/server/auth/guards";

export const metadata: Metadata = { title: AUTH_TEXT.welcome.metaTitle, robots: { index: false } };

// Écran de bienvenue (CDC 13.2, étape 4) : explique l'offre gratuite et propose une première identification.
export default async function WelcomePage() {
  if (!(await getCurrentAccount())) {
    redirect("/connexion");
  }
  const { welcome } = AUTH_TEXT;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 md:py-16">
      <h1 className="font-display text-display font-bold md:text-display-lg">{welcome.title}</h1>
      <p className="text-base text-muted-foreground md:text-lg">{welcome.description}</p>
      <ul className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 md:p-6">
        {welcome.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3 text-base text-foreground">
            <Check className="mt-0.5 size-5 shrink-0 text-brand-strong" aria-hidden="true" />
            <span>{perk}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="h-11 w-full px-5 text-base hover:bg-primary-hover sm:w-fit">
        <a href={LAYOUT_TEXT.nav.cta.href}>{welcome.cta}</a>
      </Button>
    </div>
  );
}
