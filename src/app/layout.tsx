import type { Metadata } from "next";
import { Archivo, Public_Sans } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";
import { APP_TEXT } from "@/content/fr/app";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { cn } from "@/lib/utils";

import "./globals.css";

// Archivo : axe de largeur pour l'effet « générique de film » (font-display, wdth 75).
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], display: "swap", variable: "--font-archivo" });
const publicSans = Public_Sans({ subsets: ["latin"], display: "swap", variable: "--font-public-sans" });

export const metadata: Metadata = {
  title: APP_TEXT.name,
  description: APP_TEXT.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={cn(archivo.variable, publicSans.variable)}>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#contenu"
          className="sr-only z-50 rounded-md bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {LAYOUT_TEXT.skipToContent}
        </a>
        <SiteHeader />
        <main id="contenu" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        {/* Thème clair imposé (AD-08) : le Toaster shadcn suivrait sinon le thème du système. */}
        <Toaster theme="light" />
      </body>
    </html>
  );
}
