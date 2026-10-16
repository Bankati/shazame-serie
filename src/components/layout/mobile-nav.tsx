"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { accountInitial, useAccount } from "@/client/account/account";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AUTH_TEXT } from "@/content/fr/auth";
import { LAYOUT_TEXT } from "@/content/fr/layout";

import { AccountBadge, SIGN_OUT_PATH } from "./account-menu";

// Menu mobile : le Sheet se ferme après un choix pour laisser défiler la page vers l'ancre.
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { nav } = LAYOUT_TEXT;
  const account = useAccount();
  const { account: text } = AUTH_TEXT;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="size-11 xl:hidden" aria-label={nav.openMenu}>
          <Menu className="size-6" aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" showCloseButton={false} aria-describedby={undefined} className="gap-0">
        <SheetHeader className="flex-row items-center justify-between border-b border-border">
          <SheetTitle className="font-display text-xl font-bold">{nav.menuTitle}</SheetTitle>
          <SheetClose asChild>
            <Button variant="ghost" size="icon-lg" className="size-11" aria-label={LAYOUT_TEXT.closeMenu}>
              <X className="size-6" aria-hidden="true" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <nav aria-label={nav.label} className="flex flex-col p-2">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center rounded-md px-3 text-base font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-border p-4">
          {account.status === "ready" && account.account ? (
            <>
              <div className="flex items-center gap-3">
                <AccountBadge initial={accountInitial(account.account)} />
                <div className="flex min-w-0 flex-col">
                  <span className="text-sm text-muted-foreground">{text.signedInAs}</span>
                  <span className="truncate text-sm font-medium text-foreground">
                    {account.account.email ?? account.account.displayName ?? text.fallbackName}
                  </span>
                </div>
              </div>
              <form method="post" action={SIGN_OUT_PATH}>
                <Button type="submit" variant="outline" className="h-11 w-full text-base">
                  {text.signOut}
                </Button>
              </form>
            </>
          ) : null}
          {account.status === "ready" && !account.account ? (
            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="outline" className="h-11 text-base">
                <a href="/connexion">{text.signIn}</a>
              </Button>
              <Button asChild variant="outline" className="h-11 text-base">
                <a href="/inscription">{text.signUp}</a>
              </Button>
            </div>
          ) : null}
          <Button asChild className="h-11 w-full text-base hover:bg-primary-hover">
            <a href={nav.cta.href} onClick={() => setOpen(false)}>
              {nav.cta.label}
            </a>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
