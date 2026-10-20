"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { reportClipFailure } from "@/client/observability/posthog";
import { CLIP_EXCERPT_S } from "@/shared/frames/constants";
import { type Excerpt, excerptWindow } from "@/shared/frames/sampling";
import { hasEnoughFrames } from "@/shared/frames/selection";

import { type ClipFailureStage, describeClipFailure, isReportableClipFailure } from "./clip-failure";
import { type CandidateFrame, ClipError, type ExtractionResult, extractFrames } from "./extract-frames";
import { shouldUseFallback } from "./fallback";
import { type FrameSource, openNativeSource } from "./frame-source";
import { checkClipDuration, checkClipFile, type ClipProblem } from "./validate-clip";

export type ExtractionState =
  | { status: "idle" }
  | { status: "rejected"; problem: ClipProblem }
  | { status: "reading" }
  /** Chargement de la lecture de secours (ffmpeg.wasm) ; `progress` de 0 à 1, `null` tant qu'inconnu. */
  | { status: "preparing"; progress: number | null }
  /** Vidéo de plus de 60 s : choix du passage avant l'analyse (AD-40). */
  | { status: "choosing"; durationS: number; startS: number; previewUrl: string | null }
  | { status: "extracting"; frames: CandidateFrame[]; total: number }
  | { status: "ready"; frames: CandidateFrame[]; packageBlobs: Blob[] }
  | { status: "insufficient"; frames: CandidateFrame[] };

/**
 * Parcours d'extraction d'une vidéo : lecture native, puis lecture de secours si le navigateur ne sait pas la
 * décoder ; choix du passage pour une vidéo longue. Un seul traitement à la fois (une nouvelle vidéo annule la
 * précédente) ; source et aperçus libérés à chaque changement et au démontage.
 */
export function useFrameExtraction() {
  const [state, setState] = useState<ExtractionState>({ status: "idle" });
  const controller = useRef<AbortController | null>(null);
  const source = useRef<FrameSource | null>(null);
  const file = useRef<File | null>(null);
  const previewUrls = useRef<string[]>([]);
  // Étape en cours, pour le signalement d'une vidéo illisible.
  const stage = useRef<ClipFailureStage>("native");

  const releasePreviews = useCallback(() => {
    for (const url of previewUrls.current) {
      URL.revokeObjectURL(url);
    }
    previewUrls.current = [];
  }, []);

  const closeSource = useCallback(() => {
    source.current?.close();
    source.current = null;
  }, []);

  const cancel = useCallback(() => {
    controller.current?.abort();
    controller.current = null;
    closeSource();
    file.current = null;
    releasePreviews();
  }, [closeSource, releasePreviews]);

  const fail = useCallback(
    (current: AbortController, error: unknown) => {
      if (current.signal.aborted) {
        return;
      }
      closeSource();
      releasePreviews();
      if (file.current && isReportableClipFailure(error)) {
        reportClipFailure(describeClipFailure(file.current, stage.current, error));
      }
      setState({ status: "rejected", problem: error instanceof ClipError ? error.problem : "unreadable" });
    },
    [closeSource, releasePreviews],
  );

  /** Lecture de secours, chargée à la demande (environ 32 Mo, mis en cache par le navigateur). */
  const openFallback = useCallback(async (video: File, signal: AbortSignal): Promise<FrameSource> => {
    stage.current = "fallback";
    setState({ status: "preparing", progress: null });
    const { openFfmpegSource } = await import("./ffmpeg-source");
    return openFfmpegSource(video, {
      signal,
      onLoadProgress: (progress) => {
        if (!signal.aborted) setState({ status: "preparing", progress });
      },
    });
  }, []);

  const extract = useCallback(
    async (current: AbortController, excerpt: Excerpt) => {
      const signal = current.signal;
      const run = (from: FrameSource, window: Excerpt) =>
        extractFrames(from, window, {
          signal,
          onFrame: (frame, total) => {
            // Image d'une vidéo déjà remplacée par une autre : on la jette au lieu de la mélanger.
            if (signal.aborted) {
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

      try {
        let opened = source.current;
        if (!opened) throw new ClipError("unreadable");
        let result: ExtractionResult | null = null;
        let failure: unknown = null;
        try {
          result = await run(opened, excerpt);
        } catch (error) {
          failure = error;
        }
        const attempt = result ? { ok: true as const, blank: result.blank } : { ok: false as const, error: failure };
        // Le navigateur a ouvert la vidéo sans savoir la décoder (déplacement en échec, images vides) : secours.
        if (shouldUseFallback(opened.kind, attempt, signal.aborted) && file.current) {
          releasePreviews();
          closeSource();
          opened = await openFallback(file.current, signal);
          if (signal.aborted) {
            opened.close();
            return;
          }
          source.current = opened;
          result = await run(opened, excerptWindow(opened.durationS, excerpt.startS));
        } else if (!result) {
          throw failure;
        }
        if (signal.aborted) {
          return;
        }
        // Images tirées : la source (et le worker de secours) n'a plus d'utilité.
        closeSource();
        const verdicts = result.frames.map((frame) => frame.verdict);
        setState(
          hasEnoughFrames(verdicts) && result.packageBlobs.length > 0
            ? { status: "ready", frames: result.frames, packageBlobs: result.packageBlobs }
            : { status: "insufficient", frames: result.frames },
        );
      } catch (error) {
        fail(current, error);
      }
    },
    [closeSource, fail, openFallback, releasePreviews],
  );

  const start = useCallback(
    async (video: File) => {
      cancel();

      const check = checkClipFile(video);
      if (!check.ok) {
        setState({ status: "rejected", problem: check.problem });
        return;
      }

      const current = new AbortController();
      controller.current = current;
      file.current = video;
      stage.current = "native";
      setState({ status: "reading" });

      try {
        let opened: FrameSource;
        try {
          opened = await openNativeSource(video, current.signal);
        } catch (error) {
          if (!shouldUseFallback("native", { ok: false, error }, current.signal.aborted)) throw error;
          opened = await openFallback(video, current.signal);
        }
        if (current.signal.aborted) {
          opened.close();
          return;
        }
        source.current = opened;

        const duration = checkClipDuration(opened.durationS);
        if (!duration.ok) {
          throw new ClipError(duration.problem);
        }
        const excerpt = excerptWindow(opened.durationS);
        if (opened.durationS > CLIP_EXCERPT_S) {
          setState({ status: "choosing", durationS: opened.durationS, startS: excerpt.startS, previewUrl: opened.previewUrl });
          return;
        }
        await extract(current, excerpt);
      } catch (error) {
        fail(current, error);
      }
    },
    [cancel, extract, fail, openFallback],
  );

  /** Analyse du passage choisi (vidéo de plus de 60 s). */
  const choose = useCallback(
    async (startS: number) => {
      const current = controller.current;
      const opened = source.current;
      if (!current || !opened) {
        return;
      }
      setState({ status: "reading" });
      await extract(current, excerptWindow(opened.durationS, startS));
    },
    [extract],
  );

  const reset = useCallback(() => {
    cancel();
    setState({ status: "idle" });
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return { state, start, choose, reset };
}
