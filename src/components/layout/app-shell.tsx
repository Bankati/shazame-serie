import type { ReactNode } from "react";

import { AppHeader } from "./app-header";
import { AppTabBar } from "./app-tab-bar";
import { FloatingIdentify } from "./floating-identify";
import { SiteFooter } from "./site-footer";

// Coquille de l'application (U38, AD-46) : identification, historique, liste, compte, fiches titres.
// Navigation propre à l'application ; sur mobile, barre d'onglets en bas (la place qu'elle occupe est
// réservée par `pb-20`) ; sur ordinateur, bouton flottant « Identifier » hors de la page d'identification.
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppHeader />
      <main id="contenu" className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <SiteFooter compact />
      <FloatingIdentify />
      <AppTabBar />
    </>
  );
}
