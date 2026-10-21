"use client";

import { ScanSearch } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { LAYOUT_TEXT } from "@/content/fr/layout";

import { IDENTIFY_PATH } from "./app-nav";

// Bouton flottant « Identifier un titre » (U38, AD-46) : sur ordinateur, à un clic de l'action principale depuis
// l'historique, la liste, le compte ou une fiche. Sur mobile, la barre d'onglets joue ce rôle.
export function FloatingIdentify() {
  const pathname = usePathname();
  if (pathname === IDENTIFY_PATH) {
    return null;
  }

  return (
    <Link
      href={IDENTIFY_PATH}
      className="fixed right-6 bottom-6 z-30 hidden h-12 items-center gap-2 rounded-full bg-primary px-5 text-base font-semibold text-primary-foreground shadow-lg transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring md:inline-flex"
    >
      <ScanSearch className="size-5" aria-hidden="true" />
      {LAYOUT_TEXT.app.floating}
    </Link>
  );
}
