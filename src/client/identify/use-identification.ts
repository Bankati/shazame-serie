"use client";

import { useEffect, useState } from "react";

import type { FrameMode, IdentifyResponse } from "@/schemas/identify";

import { type IdentifyFailure, sendFrames } from "./send-frames";

export type IdentificationState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; response: IdentifyResponse }
  | { status: "failed"; failure: IdentifyFailure };

type Settled = Extract<IdentificationState, { status: "done" | "failed" }>;

/**
 * Envoie automatiquement le paquet dès qu'il est prêt (une seule action pour l'utilisateur).
 * L'état « envoi en cours » se déduit du paquet courant : seule la réponse déclenche une mise à jour.
 * Un nouveau paquet (autre clip) annule l'envoi précédent ; `null` remet l'état à zéro.
 */
export function useIdentification(packageBlobs: readonly Blob[] | null, mode: FrameMode = "clip"): IdentificationState {
  const [settled, setSettled] = useState<{ blobs: readonly Blob[]; state: Settled } | null>(null);

  useEffect(() => {
    if (!packageBlobs) {
      return;
    }
    const controller = new AbortController();
    sendFrames(packageBlobs, mode, controller.signal)
      .then((call) => {
        if (!controller.signal.aborted) {
          setSettled({
            blobs: packageBlobs,
            state: call.ok ? { status: "done", response: call.response } : { status: "failed", failure: call.failure },
          });
        }
      })
      .catch(() => {
        // Annulation volontaire (autre clip, démontage) : rien à afficher.
      });
    return () => controller.abort();
    // Le mode change toujours avec son paquet (même état « prêt ») : pas d'envoi en double.
  }, [packageBlobs, mode]);

  if (!packageBlobs) {
    return { status: "idle" };
  }
  return settled?.blobs === packageBlobs ? settled.state : { status: "sending" };
}
