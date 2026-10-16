"use client";

import { reloadQuota } from "@/client/identify/quota";

import { reloadAccount } from "./account";

/**
 * Après une connexion ou une déconnexion, part vers `to`. Next transforme une navigation interne en
 * navigation sans rechargement (constaté en U04) : compte et quota de l'en-tête sont donc rechargés ici.
 */
export function navigateAfterSessionChange(to: string): void {
  if (to.startsWith("/")) {
    reloadAccount();
    reloadQuota();
  }
  window.location.assign(to);
}
