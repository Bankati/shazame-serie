import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

// Coquille de la vitrine (U38, AD-46) : en-tête de présentation (ancres, tarifs, FAQ), pied de page complet.
// Sert à l'accueil, aux pages légales, aux pages de compte (connexion, inscription) et aux pages d'erreur.
export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="contenu" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
