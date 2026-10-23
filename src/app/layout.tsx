import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";

import { MotionProvider } from "@/components/showcase/motion-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_TEXT } from "@/content/fr/app";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { siteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

import "./globals.css";

// Archivo : axe de largeur pour l'effet « générique de film » (font-display, wdth 75).
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-archivo" });
const publicSans = Public_Sans({ subsets: ["latin"], display: "swap", variable: "--font-public-sans" });

export const metadata: Metadata = {
  // Base des adresses relatives (URL canoniques, Open Graph des fiches).
  metadataBase: new URL(siteUrl()),
  title: { default: APP_TEXT.name, template: `%s | ${APP_TEXT.name}` },
  description: APP_TEXT.tagline,
};

export default function RootLayout({ children, modal }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={cn("dark", archivo.variable, publicSans.variable)}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {LAYOUT_TEXT.skipToContent}
        </a>
        {/* Sans JavaScript, les sections révélées au défilement (Reveal) restent visibles. */}
        <noscript>
          <style>{"[data-reveal]{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        {/* En-tête, contenu et pied de page : coquille de la vitrine ou de l'application (U38, AD-46). */}
        <MotionProvider>
          {children}
          {/* Fenêtre de connexion ouverte depuis le site (routes interceptées, U41). */}
          {modal}
        </MotionProvider>
        {/* Thème sombre imposé (AD-35) : le Toaster shadcn suivrait sinon le thème du système. */}
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
