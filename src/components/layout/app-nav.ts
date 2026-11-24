import { Bookmark, CalendarDays, History, ScanSearch, UserRound } from "lucide-react";

import { LAYOUT_TEXT } from "@/content/fr/layout";

import { ACCOUNT_PATH, HISTORY_PATH, WATCHLIST_PATH } from "./account-menu";

/** Page d'identification de l'application (U38, AD-46). */
export const IDENTIFY_PATH = "/identifier";

/** Calendrier des sorties (U42, AD-47). */
export const CALENDAR_PATH = "/calendrier";

const { app } = LAYOUT_TEXT;

/** Entrées de la navigation de l'application, communes à l'en-tête et à la barre d'onglets. */
export const APP_NAV = [
  { href: IDENTIFY_PATH, label: app.identify, icon: ScanSearch },
  { href: CALENDAR_PATH, label: app.calendar, icon: CalendarDays },
  { href: HISTORY_PATH, label: app.history, icon: History },
  { href: WATCHLIST_PATH, label: app.watchlist, icon: Bookmark },
] as const;

export const ACCOUNT_NAV = { href: ACCOUNT_PATH, label: app.account, icon: UserRound } as const;

/** Entrée active : la page elle-même ou une de ses sous-pages. */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
