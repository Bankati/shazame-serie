"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LAYOUT_TEXT } from "@/content/fr/layout";
import { cn } from "@/lib/utils";

import { AccountMenu } from "./account-menu";
import { APP_NAV, isActive } from "./app-nav";
import { Logo } from "./logo";
import { QuotaCounter } from "./quota-counter";

// En-tête de l'application (U38, AD-46) : logo, navigation (ordinateur), compteur de quota et compte. Sur mobile,
// la navigation passe par la barre d'onglets du bas ; l'en-tête garde le logo et le compteur.
export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label={LAYOUT_TEXT.app.label} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {APP_NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                      active ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className={cn("size-4", active && "text-brand-strong")} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <QuotaCounter />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
