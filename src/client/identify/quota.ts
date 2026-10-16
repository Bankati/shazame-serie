"use client";

import { useEffect, useSyncExternalStore } from "react";
import { z } from "zod";

import { type QuotaInfo, quotaInfoSchema } from "@/schemas/identify";

// Quota du jour partagé entre le compteur de l'en-tête et le panneau d'identification :
// chargé une fois (GET /api/quota), puis mis à jour par chaque réponse d'identification.

let current: QuotaInfo | null = null;
let loading = false;
const listeners = new Set<() => void>();

export function publishQuota(quota: QuotaInfo): void {
  current = quota;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const responseSchema = z.object({ ok: z.literal(true), data: quotaInfoSchema });

// Numéro de chargement : une réponse arrivée après un changement de session est ignorée.
let generation = 0;

async function loadQuota(): Promise<void> {
  if (loading || current) {
    return;
  }
  loading = true;
  const mine = generation;
  try {
    const response = await fetch("/api/quota", { cache: "no-store" });
    const parsed = responseSchema.safeParse(await response.json());
    if (parsed.success && mine === generation) {
      publishQuota(parsed.data.data);
    }
  } catch {
    // Sans compteur, l'identification reste possible : le serveur applique le quota de toute façon.
  } finally {
    loading = false;
  }
}

/** Session changée (connexion, déconnexion) : le quota n'est plus le même (visiteur ou compte). */
export function reloadQuota(): void {
  generation += 1;
  loading = false;
  current = null;
  for (const listener of listeners) {
    listener();
  }
  void loadQuota();
}

/** Quota du jour, ou null tant qu'il n'est pas connu. */
export function useQuota(): QuotaInfo | null {
  const quota = useSyncExternalStore(subscribe, () => current, () => null);
  useEffect(() => {
    void loadQuota();
  }, []);
  return quota;
}
