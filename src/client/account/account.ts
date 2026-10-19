"use client";

import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";

import { type AccountSummary, accountSummarySchema } from "@/schemas/account";

// Compte connecté pour l'en-tête et le menu mobile (U04) : chargé une fois (GET /api/account), puis rechargé
// à chaque connexion ou déconnexion (reloadAccount). Le layout ne lit pas la session côté serveur, pour que
// les pages restent statiques (plans/U04.md, décision 9).

export type AccountState = { status: "loading" } | { status: "ready"; account: AccountSummary["account"] };

const LOADING: AccountState = { status: "loading" };
let current: AccountState = LOADING;
let started = false;
const listeners = new Set<() => void>();

const responseSchema = z.object({ ok: z.literal(true), data: accountSummarySchema });

function publish(state: AccountState): void {
  current = state;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Numéro de chargement : une réponse arrivée après un changement de session est ignorée.
let generation = 0;

async function load(): Promise<void> {
  if (started) {
    return;
  }
  started = true;
  const mine = generation;
  let account: AccountSummary["account"] = null;
  try {
    const response = await fetch("/api/account", { cache: "no-store" });
    const parsed = responseSchema.safeParse(await response.json());
    account = parsed.success ? parsed.data.data.account : null;
  } catch {
    // Service injoignable : on propose la connexion, le serveur revérifie de toute façon.
  }
  if (mine === generation) {
    publish({ status: "ready", account });
  }
}

/** Session changée (connexion, déconnexion) : Next navigue sans recharger la page, l'état doit repartir. */
export function reloadAccount(): void {
  generation += 1;
  started = false;
  publish(LOADING);
  void load();
}

export function useAccount(): AccountState {
  const state = useSyncExternalStore(subscribe, () => current, () => LOADING);
  useEffect(() => {
    void load();
  }, []);
  return state;
}

/** Initiale affichée dans la pastille du menu de compte. */
export function accountInitial(account: NonNullable<AccountSummary["account"]>): string {
  const source = account.displayName?.trim() || account.email?.trim() || "?";
  return source.charAt(0).toLocaleUpperCase("fr");
}
