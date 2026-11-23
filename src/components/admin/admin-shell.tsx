import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ADMIN_TEXT } from "@/content/fr/admin";
import { cn } from "@/lib/utils";

const LINK =
  "flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

// Coquille du back-office (U25, ui-context.md) : barre latérale fixe sur desktop, barre du haut sur mobile,
// aucun effet décoratif. Navigation : `AdminNav` (U26).
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="flex flex-col gap-4 border-b border-border bg-card p-4 md:sticky md:top-0 md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-display text-lg font-bold text-foreground">{ADMIN_TEXT.shellLabel}</span>
          <ThemeToggle />
        </div>
        <AdminNav />
        <Link href="/identifier" className={cn(LINK, "text-muted-foreground md:mt-auto")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          {ADMIN_TEXT.backToApp}
        </Link>
      </aside>
      <main id="contenu" className="min-w-0 flex-1 px-4 py-8 sm:px-6 md:px-8">
        {children}
      </main>
    </div>
  );
}
