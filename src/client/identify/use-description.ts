"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { IdentifyResponse } from "@/schemas/identify";

import { type IdentifyFailure, sendDescription } from "./send-frames";

export type DescriptionState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done"; response: IdentifyResponse }
  | { status: "failed"; failure: IdentifyFailure };

/**
 * Identification par description (U35) : un envoi à la fois ; un nouvel envoi, « Réinitialiser » ou le démontage
 * annulent le précédent. Le texte reste dans le champ du navigateur, il n'est conservé nulle part ailleurs.
 */
export function useDescriptionIdentification() {
  const [state, setState] = useState<DescriptionState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
  }, []);

  const submit = useCallback(
    async (text: string) => {
      cancel();
      const current = new AbortController();
      controller.current = current;
      setState({ status: "sending" });
      try {
        const call = await sendDescription(text, current.signal);
        if (!current.signal.aborted) {
          setState(call.ok ? { status: "done", response: call.response } : { status: "failed", failure: call.failure });
        }
      } catch {
        // Annulation volontaire (nouvel envoi, démontage) : rien à afficher.
      }
    },
    [cancel],
  );

  const reset = useCallback(() => {
    cancel();
    setState({ status: "idle" });
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { state, submit, reset };
}
