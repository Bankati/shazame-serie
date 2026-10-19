"use client";

import { History, ListVideo, LogOut, UserRound } from "lucide-react";
import Link from "next/link";

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
export const HISTORY_PATH = "/historique";
export const WATCHLIST_PATH = "/ma-liste";
export const ACCOUNT_PATH = "/compte";

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
          <AccountBadge initial={accountInitial(account)} avatarUrl={account.avatarUrl} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 shadow-lg">
        <DropdownMenuLabel className="flex flex-col gap-1 px-2 py-2">
          <span className="text-sm text-muted-foreground">{text.signedInAs}</span>
          <span className="truncate text-sm font-medium text-foreground">{account.email ?? name}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="min-h-11 gap-2 text-sm">
          <Link href={ACCOUNT_PATH}>
            <UserRound className="size-4" aria-hidden="true" />
            {text.profile}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11 gap-2 text-sm">
          <Link href={WATCHLIST_PATH}>
            <ListVideo className="size-4" aria-hidden="true" />
            {text.watchlist}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="min-h-11 gap-2 text-sm">
          <Link href={HISTORY_PATH}>
            <History className="size-4" aria-hidden="true" />
            {text.history}
          </Link>
        </DropdownMenuItem>
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

export function AccountBadge({ initial, avatarUrl }: { initial: string; avatarUrl?: string | null }) {
  if (avatarUrl) {
    // Photo du bucket privé (lien signé), déjà réduite à 256 px par le serveur : pas d'optimiseur.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt="" aria-hidden="true" className="size-9 rounded-full object-cover ring-1 ring-border" />;
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-inverse"
    >
      {initial}
    </span>
  );
}
