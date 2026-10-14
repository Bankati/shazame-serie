"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { hasEnoughFrames } from "@/shared/frames/selection";

import { type CandidateFrame, ClipError, extractFrames } from "./extract-frames";
import { checkClipFile, type ClipProblem } from "./validate-clip";

export type ExtractionState =
  | { status: "idle" }
  | { status: "rejected"; problem: ClipProblem }
  | { status: "reading" }
  | { status: "extracting"; frames: CandidateFrame[]; total: number }
  | { status: "ready"; frames: CandidateFrame[]; packageBlobs: Blob[] }
  | { status: "insufficient"; frames: CandidateFrame[] };

/**
 * Parcours d'extraction d'un clip : un seul traitement à la fois (un nouveau clip annule le précédent),
 * aperçus libérés à chaque changement et au démontage.
 */
export function useFrameExtraction() {
  const [state, setState] = useState<ExtractionState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  const previewUrls = useRef<string[]>([]);

  const releasePreviews = useCallback(() => {
    for (const url of previewUrls.current) {
      URL.revokeObjectURL(url);
    }
    previewUrls.current = [];
  }, []);

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    releasePreviews();
  }, [releasePreviews]);

  const start = useCallback(
    async (file: File) => {
      cancel();

      const check = checkClipFile(file);
      if (!check.ok) {
        setState({ status: "rejected", problem: check.problem });
        return;
      }

      const current = new AbortController();
      controller.current = current;
      setState({ status: "reading" });

      try {
        const result = await extractFrames(file, {
          signal: current.signal,
          onFrame: (frame, total) => {
            // Image d'un clip déjà remplacé par un autre : on la jette au lieu de la mélanger.
            if (current.signal.aborted) {
              URL.revokeObjectURL(frame.previewUrl);
              return;
            }
            previewUrls.current.push(frame.previewUrl);
            setState((previous) => ({
              status: "extracting",
              frames: [...(previous.status === "extracting" ? previous.frames : []), frame],
              total,
            }));
          },
        });
        if (current.signal.aborted) {
          return;
        }
        const verdicts = result.frames.map((frame) => frame.verdict);
        setState(
          hasEnoughFrames(verdicts) && result.packageBlobs.length > 0
            ? { status: "ready", frames: result.frames, packageBlobs: result.packageBlobs }
            : { status: "insufficient", frames: result.frames },
        );
      } catch (error) {
        if (current.signal.aborted) {
          return;
        }
        releasePreviews();
        setState({ status: "rejected", problem: error instanceof ClipError ? error.problem : "unreadable" });
      }
    },
    [cancel, releasePreviews],
  );

  const reset = useCallback(() => {
    cancel();
    setState({ status: "idle" });
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { state, start, reset };
}
