import { APP_TEXT } from "@/content/fr/app";
import { LAYOUT_TEXT } from "@/content/fr/layout";

import { Logo } from "./logo";

const linkClass =
  "inline-flex min-h-11 items-center text-sm text-inverse-muted underline-offset-4 hover:text-inverse-foreground hover:underline focus-visible:outline-2 focus-visible:outline-brand";

// Pied de page sur surface inversée, avec la mention obligatoire des sources (invariant 12).
export function SiteFooter() {
  const { footer, nav } = LAYOUT_TEXT;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-inverse text-inverse-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4 md:py-16">
        <div className="flex flex-col gap-4 md:col-span-2">
          <Logo tone="inverse" />
          <p className="max-w-sm text-sm text-inverse-muted">{footer.tagline}</p>
        </div>
        <nav aria-label={footer.discoverTitle}>
          <h2 className="text-sm font-semibold">{footer.discoverTitle}</h2>
          <ul className="mt-2">
            {nav.links.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label={footer.helpTitle}>
          <h2 className="text-sm font-semibold">{footer.helpTitle}</h2>
          <ul className="mt-2">
            {footer.helpLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-inverse-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-inverse-muted sm:px-6">
          <h2 className="font-semibold text-inverse-foreground">{footer.sourcesTitle}</h2>
          <p>{footer.tmdbNotice}</p>
          <p>{footer.streamingNotice}</p>
          <p className="pt-2">{footer.copyright(year, APP_TEXT.name)}</p>
        </div>
      </div>
    </footer>
  );
}
