"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { IdentifyResponse } from "@/schemas/identify";

import { type IdentifyCall, type IdentifyFailure, sendDescription, sendLink } from "./send-frames";

export type QueryState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; response: IdentifyResponse }
  | { status: "failed"; failure: IdentifyFailure };

type Sender = (value: string, signal: AbortSignal) => Promise<IdentifyCall>;

/**
 * Identification par texte saisi (description U35, lien U36) : un envoi à la fois ; un nouvel envoi,
 * « Réinitialiser » ou le démontage annulent le précédent. La saisie n'est conservée nulle part ailleurs.
 */
function useQueryIdentification(send: Sender) {
  const [state, setState] = useState<QueryState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
  }, []);

  const submit = useCallback(
    async (value: string) => {
      cancel();
      const current = new AbortController();
      controller.current = current;
      setState({ status: "sending" });
      try {
        const call = await send(value, current.signal);
        if (!current.signal.aborted) {
          setState(call.ok ? { status: "done", response: call.response } : { status: "failed", failure: call.failure });
        }
      } catch {
        // Annulation volontaire (nouvel envoi, démontage) : rien à afficher.
      }
    },
    [cancel, send],
  );

  const reset = useCallback(() => {
    cancel();
    setState({ status: "idle" });
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { state, submit, reset };
}

export function useDescriptionIdentification() {
  return useQueryIdentification(sendDescription);
}

export function useLinkIdentification() {
  return useQueryIdentification(sendLink);
}
