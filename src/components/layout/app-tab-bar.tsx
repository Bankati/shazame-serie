"use client";

import { LogIn } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAccount } from "@/client/account/account";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { cn } from "@/lib/utils";

import { ACCOUNT_NAV, APP_NAV, isActive } from "./app-nav";

// Barre d'onglets du bas (U38, AD-46), mobile seulement : Identifier, Historique, Ma liste, Compte (ou Connexion
// pour un visiteur). Zones tactiles de 56 px de haut ; marge du bas pour la barre système des iPhone.
export function AppTabBar() {
  const pathname = usePathname();
  const state = useAccount();
  const { app } = LAYOUT_TEXT;
  const signedIn = state.status === "ready" && state.account !== null;
  const last = signedIn
    ? ACCOUNT_NAV
    : { href: `/connexion?suite=${encodeURIComponent(pathname)}`, label: app.signIn, icon: LogIn };

  return (
    <nav
      aria-label={app.tabsLabel}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
      // Barre système des iPhone (encoche du bas) : valeur fournie par le navigateur, hors échelle d'espacement.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-4">
        {[...APP_NAV, last].map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href.split("?")[0] ?? href);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                  active ? "text-brand-strong" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
