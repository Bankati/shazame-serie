"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { CLIP_EXCERPT_S } from "@/shared/frames/constants";

type ExcerptPickerProps = {
  durationS: number;
  /** Début proposé : le milieu de la vidéo. */
  initialStartS: number;
  /** Vidéo lisible par le navigateur : aperçu de l'image au début du passage (absent en lecture de secours). */
  previewUrl: string | null;
  onAnalyze: (startS: number) => void;
  onCancel: () => void;
};

// Vidéo de plus de 60 s (AD-40) : choix du passage de 60 s analysé, avant tout envoi. Rien n'est décompté
// tant que l'utilisateur n'a pas lancé l'analyse.
export function ExcerptPicker({ durationS, initialStartS, previewUrl, onAnalyze, onCancel }: ExcerptPickerProps) {
  const { excerpt } = IDENTIFY_TEXT;
  const [startS, setStartS] = useState(Math.round(initialStartS));
  const latestStartS = Math.floor(durationS - CLIP_EXCERPT_S);
  const endS = Math.min(durationS, startS + CLIP_EXCERPT_S);
  const sliderId = useId();
  const rangeId = useId();
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (video.current && video.current.readyState >= HTMLMediaElement.HAVE_METADATA) {
      video.current.currentTime = startS;
    }
  }, [startS]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="font-display text-xl font-bold">{excerpt.title}</p>
        <p className="text-sm text-muted-foreground">{excerpt.explanation(formatDuration(durationS))}</p>
      </div>
      {previewUrl ? (
        <video
          ref={video}
          src={previewUrl}
          muted
          playsInline
          preload="metadata"
          aria-label={excerpt.preview}
          onLoadedMetadata={(event) => {
            event.currentTarget.currentTime = startS;
          }}
          className="aspect-video w-full rounded-lg bg-muted object-contain"
        />
      ) : null}
      <div className="flex flex-col gap-2">
        <label htmlFor={sliderId} className="text-sm font-medium text-foreground">
          {excerpt.label}
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={latestStartS}
          step={1}
          value={startS}
          aria-describedby={rangeId}
          aria-valuetext={excerpt.range(formatDuration(startS), formatDuration(endS))}
          onChange={(event) => setStartS(Number(event.target.value))}
          className="h-11 w-full cursor-pointer accent-primary"
        />
        <p id={rangeId} className="text-sm text-muted-foreground">
          {excerpt.range(formatDuration(startS), formatDuration(endS))}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" onClick={() => onAnalyze(startS)} className="h-11 w-full text-base hover:bg-primary-hover sm:w-fit">
          {excerpt.analyze}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="h-11 w-full text-base sm:w-fit">
          {excerpt.another}
        </Button>
      </div>
    </div>
  );
}

/** 75 → « 1:15 », 3725 → « 1:02:05 ». */
export function formatDuration(totalS: number): string {
  const seconds = Math.max(0, Math.floor(totalS));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = String(seconds % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}
