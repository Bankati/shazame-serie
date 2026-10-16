"use client";

import { LogOut } from "lucide-react";

import { accountInitial, useAccount } from "@/client/account/account";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AUTH_TEXT } from "@/content/fr/auth";

/** Déconnexion : formulaire HTML vers POST /auth/deconnexion, puis rechargement complet de l'accueil. */
export const SIGN_OUT_PATH = "/auth/deconnexion";

// Compte dans l'en-tête (desktop) : « Se connecter », ou pastille + menu avec la déconnexion (U04).
// Sur mobile, les mêmes entrées sont dans le menu (MobileNav).
export function AccountMenu() {
  const state = useAccount();
  const { account: text } = AUTH_TEXT;

  if (state.status === "loading") {
    return null;
  }
  if (!state.account) {
    return (
      <Button asChild variant="ghost" className="hidden h-11 px-3 text-sm lg:inline-flex">
        <a href="/connexion">{text.signIn}</a>
      </Button>
    );
  }

  const account = state.account;
  const name = account.displayName || account.email || text.fallbackName;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="hidden h-11 gap-2 px-2 lg:inline-flex" aria-label={text.menuLabel(name)}>
          <AccountBadge initial={accountInitial(account)} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 shadow-lg">
        <DropdownMenuLabel className="flex flex-col gap-1 px-2 py-2">
          <span className="text-sm text-muted-foreground">{text.signedInAs}</span>
          <span className="truncate text-sm font-medium text-foreground">{account.email ?? name}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form method="post" action={SIGN_OUT_PATH}>
          <DropdownMenuItem asChild className="min-h-11 w-full gap-2 text-sm">
            <button type="submit">
              <LogOut className="size-4" aria-hidden="true" />
              {text.signOut}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AccountBadge({ initial }: { initial: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 items-center justify-center rounded-full bg-inverse text-sm font-bold text-inverse-foreground"
    >
      {initial}
    </span>
  );
}
