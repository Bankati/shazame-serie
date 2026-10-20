"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { reportClipFailure } from "@/client/observability/posthog";
import type { FrameMode } from "@/schemas/identify";
import { CLIP_EXCERPT_S } from "@/shared/frames/constants";
import { type Excerpt, excerptWindow } from "@/shared/frames/sampling";
import { hasEnoughFrames } from "@/shared/frames/selection";

import { type ClipFailureStage, describeClipFailure, isReportableClipFailure } from "./clip-failure";
import { decodeImage } from "./decode-image";
import { type CandidateFrame, ClipError, type ExtractionResult, extractFrames, extractFromImages } from "./extract-frames";
import { shouldUseFallback } from "./fallback";
import { type FrameSource, openNativeSource } from "./frame-source";
import { classifySelection } from "./select-files";
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
  | { status: "ready"; mode: FrameMode; frames: CandidateFrame[]; packageBlobs: Blob[] }
  | { status: "insufficient"; mode: FrameMode; frames: CandidateFrame[] };

/**
 * Parcours d'extraction d'une vidéo ou de captures (U34) : lecture native, puis lecture de secours si le
 * navigateur ne sait pas décoder la vidéo ; choix du passage pour une vidéo longue. Un seul traitement à la fois
 * (une nouvelle sélection annule la précédente) ; source et aperçus libérés à chaque changement et au démontage.
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
    (current: AbortController, error: unknown, failedFile: File | null | undefined = file.current) => {
      if (current.signal.aborted) {
        return;
      }
      closeSource();
      releasePreviews();
      if (failedFile && isReportableClipFailure(error)) {
        reportClipFailure(describeClipFailure(failedFile, stage.current, error));
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

  /** Affiche chaque image dès qu'elle est jugée ; celle d'une sélection déjà remplacée est jetée. */
  const showFrame = useCallback(
    (signal: AbortSignal) => (frame: CandidateFrame, total: number) => {
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
    [],
  );

  const extract = useCallback(
    async (current: AbortController, excerpt: Excerpt) => {
      const signal = current.signal;
      const run = (from: FrameSource, window: Excerpt) => extractFrames(from, window, { signal, onFrame: showFrame(signal) });

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
            ? { status: "ready", mode: "clip", frames: result.frames, packageBlobs: result.packageBlobs }
            : { status: "insufficient", mode: "clip", frames: result.frames },
        );
      } catch (error) {
        fail(current, error);
      }
    },
    [closeSource, fail, openFallback, releasePreviews, showFrame],
  );

  /** Captures (U34) : décodées une à une, jugées, réduites ; 1 exploitable suffit. */
  const startImages = useCallback(
    async (images: File[]) => {
      const current = new AbortController();
      controller.current = current;
      stage.current = "native";
      setState({ status: "reading" });

      let decoding: File | undefined;
      try {
        const result = await extractFromImages(
          images.length,
          (index) => {
            decoding = images[index];
            return decoding ? decodeImage(decoding) : Promise.reject(new ClipError("image_unreadable"));
          },
          { signal: current.signal, onFrame: showFrame(current.signal) },
        );
        if (current.signal.aborted) {
          return;
        }
        setState(
          result.packageBlobs.length > 0
            ? { status: "ready", mode: "images", frames: result.frames, packageBlobs: result.packageBlobs }
            : { status: "insufficient", mode: "images", frames: result.frames },
        );
      } catch (error) {
        fail(current, error, decoding);
      }
    },
    [fail, showFrame],
  );

  const start = useCallback(
    async (selected: readonly File[]) => {
      cancel();

      const selection = classifySelection(selected);
      if (!selection.ok) {
        setState({ status: "rejected", problem: selection.problem });
        return;
      }
      if (selection.kind === "images") {
        await startImages(selection.files);
        return;
      }
      const video = selection.file;
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
    [cancel, extract, fail, openFallback, startImages],
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
