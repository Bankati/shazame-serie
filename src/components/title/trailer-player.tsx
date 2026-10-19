"use client";

import { Play } from "lucide-react";
import { useState } from "react";

import { TITLE_TEXT } from "@/content/fr/title";

// Bande-annonce chargée seulement au clic (aucune requête vers YouTube avant), domaine youtube-nocookie.
export function TrailerPlayer({ youtubeKey, title }: { youtubeKey: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const { trailer } = TITLE_TEXT;

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeKey)}?autoplay=1&rel=0`}
        title={trailer.frameTitle(title)}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="aspect-video w-full rounded-lg bg-inverse"
      />
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setPlaying(true)}
        className="flex aspect-video w-full items-center justify-center rounded-lg bg-inverse text-inverse-foreground hover:bg-inverse/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span className="flex items-center gap-3 text-base font-medium">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand text-inverse">
            <Play className="size-6" aria-hidden="true" />
          </span>
          {trailer.play(title)}
        </span>
      </button>
      <p className="text-sm text-muted-foreground">{trailer.hint}</p>
    </div>
  );
}
