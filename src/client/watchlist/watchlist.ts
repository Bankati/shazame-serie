"use client";

import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";

import { errorCodeSchema } from "@/schemas/errors";
import { type WatchlistItem, watchlistChangeSchema, watchlistKey, watchlistStateSchema } from "@/schemas/watchlist";

// Liste de suivi côté navigateur (U18) : chargée une fois (GET /api/watchlist), partagée par tous les boutons
// de la page, mise à jour de façon optimiste puis confirmée ou annulée par le serveur. Les fiches étant en
// cache (ISR), l'état « dans ma liste » ne peut venir que d'ici.

export type WatchlistStore =
  | { status: "loading" }
  | { status: "visitor" }
  | { status: "unavailable" }
  | { status: "ready"; keys: ReadonlySet<string>; count: number; limit: number | null };

export type ChangeFailure = "full" | "suspended" | "visitor" | "unavailable";

const LOADING: WatchlistStore = { status: "loading" };
let current: WatchlistStore = LOADING;
let started = false;
let generation = 0;
const listeners = new Set<() => void>();

const stateResponse = z.object({ ok: z.literal(true), data: watchlistStateSchema });
const changeResponse = z.object({ ok: z.literal(true), data: watchlistChangeSchema });
const errorResponse = z.object({ ok: z.literal(false), error: z.object({ code: errorCodeSchema }) });

function publish(state: WatchlistStore): void {
  current = state;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function load(): Promise<void> {
  if (started) return;
  started = true;
  const mine = generation;
  let next: WatchlistStore = { status: "unavailable" };
  try {
    const response = await fetch("/api/watchlist", { cache: "no-store" });
    if (response.status === 401) {
      next = { status: "visitor" };
    } else {
      const parsed = stateResponse.safeParse(await response.json());
      if (parsed.success) {
        const { items, limit } = parsed.data.data;
        next = { status: "ready", keys: new Set(items.map(watchlistKey)), count: items.length, limit };
      }
    }
  } catch {
    // Réseau indisponible : bouton désactivé, réessayé au prochain chargement de page.
  }
  if (mine === generation) publish(next);
}

/** Session changée (connexion, déconnexion) : la liste n'est plus la même. */
export function reloadWatchlist(): void {
  generation += 1;
  started = false;
  publish(LOADING);
  void load();
}

export function useWatchlist(): WatchlistStore {
  const state = useSyncExternalStore(subscribe, () => current, () => LOADING);
  useEffect(() => {
    void load();
  }, []);
  return state;
}

/**
 * Ajoute ou retire un titre : l'état change tout de suite, puis le serveur confirme. En cas de refus,
 * l'état revient en arrière et la raison est renvoyée pour afficher un message.
 */
export async function toggleWatchlist(item: WatchlistItem): Promise<{ ok: true } | { ok: false; reason: ChangeFailure }> {
  const before = current;
  if (before.status !== "ready") {
    return { ok: false, reason: before.status === "visitor" ? "visitor" : "unavailable" };
  }
  const key = watchlistKey(item);
  const adding = !before.keys.has(key);
  const keys = new Set(before.keys);
  if (adding) keys.add(key);
  else keys.delete(key);
  publish({ ...before, keys, count: before.count + (adding ? 1 : -1) });

  try {
    const response = await fetch("/api/watchlist", {
      method: adding ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
      // L'ajout ou le retrait aboutit même si l'on quitte la page juste après le clic (bouton optimiste).
      keepalive: true,
    });
    const body: unknown = await response.json();
    const success = changeResponse.safeParse(body);
    if (success.success) {
      if (current.status === "ready") publish({ ...current, count: success.data.data.count, limit: success.data.data.limit });
      return { ok: true };
    }
    const failure = errorResponse.safeParse(body);
    publish(before);
    switch (failure.success ? failure.data.error.code : null) {
      case "WATCHLIST_FULL":
        return { ok: false, reason: "full" };
      case "ACCOUNT_SUSPENDED":
        return { ok: false, reason: "suspended" };
      case "UNAUTHENTICATED":
        return { ok: false, reason: "visitor" };
      default:
        return { ok: false, reason: "unavailable" };
    }
  } catch {
    publish(before);
    return { ok: false, reason: "unavailable" };
  }
}
