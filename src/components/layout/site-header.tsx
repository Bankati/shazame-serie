import { Button } from "@/components/ui/button";
import { LAYOUT_TEXT } from "@/content/fr/layout";

import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

// Barre supérieure fine (ui-context.md) : logo et ancres de l'accueil. Le quota (U11),
// les liens Liste / Historique (U18, U19) et le compte (U04) viendront s'ajouter ici.
export function SiteHeader() {
  const { nav } = LAYOUT_TEXT;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav aria-label={nav.label} className="hidden md:block">
          <ul className="flex items-center gap-1">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden h-11 px-5 text-sm hover:bg-primary-hover md:inline-flex">
            <a href={nav.cta.href}>{nav.cta.label}</a>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
