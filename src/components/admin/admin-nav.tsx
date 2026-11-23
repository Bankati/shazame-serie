"use client";

import { LayoutDashboard, type LucideIcon, ScrollText, SlidersHorizontal, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_TEXT } from "@/content/fr/admin";
import { cn } from "@/lib/utils";

const LINK =
  "flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: ADMIN_TEXT.nav.dashboard, icon: LayoutDashboard },
  { href: "/admin/utilisateurs", label: ADMIN_TEXT.nav.users, icon: Users },
  { href: "/admin/reglages", label: ADMIN_TEXT.nav.settings, icon: SlidersHorizontal },
  { href: "/admin/journal", label: ADMIN_TEXT.nav.audit, icon: ScrollText },
];

// Navigation du back-office (U26) : l'entrée de la page courante est marquée (aria-current).
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label={ADMIN_TEXT.nav.label} className="flex gap-1 overflow-x-auto md:flex-col">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const current = pathname === href;
        return (
          <Link key={href} href={href} className={cn(LINK, "shrink-0", current && "bg-accent")} aria-current={current ? "page" : undefined}>
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
