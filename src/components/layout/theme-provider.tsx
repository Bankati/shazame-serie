"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// Thème (AD-49) : clair par défaut, sombre au choix. Classe `.dark` sur <html> ; le réglage du système n'est pas
// suivi (choix du fondateur : fond clair par défaut). Pas de transition pendant la bascule.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
