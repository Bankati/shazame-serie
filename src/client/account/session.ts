"use client";

import { reloadQuota } from "@/client/identify/quota";
import { reloadWatchlist } from "@/client/watchlist/watchlist";

import { reloadAccount } from "./account";

/**
 * Après une connexion ou une déconnexion, part vers `to`. Next transforme une navigation interne en
 * navigation sans rechargement (constaté en U04) : compte, quota et liste de suivi sont donc rechargés ici.
 */
export function navigateAfterSessionChange(to: string): void {
  if (to.startsWith("/")) {
    reloadAccount();
    reloadQuota();
    reloadWatchlist();
  }
  window.location.assign(to);
}
