"use client";

import { type KeyboardEvent, useRef } from "react";

import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { cn } from "@/lib/utils";

export const IDENTIFY_TABS = ["media", "description"] as const;
export type IdentifyTab = (typeof IDENTIFY_TABS)[number];

type IdentifyTabsProps = {
  value: IdentifyTab;
  onChange: (tab: IdentifyTab) => void;
  /** Identifiant du panneau affiché (aria-controls). */
  panelId: string;
};

// Choix du mode d'identification (U35, AD-43) : onglets accessibles (flèches, Début, Fin ; un seul arrêt de
// tabulation). U36 ajoutera « Lien ».
export function IdentifyTabs({ value, onChange, panelId }: IdentifyTabsProps) {
  const { tabs } = IDENTIFY_TEXT;
  const refs = useRef<Partial<Record<IdentifyTab, HTMLButtonElement | null>>>({});

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = IDENTIFY_TABS.indexOf(value);
    const last = IDENTIFY_TABS.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    const tab = IDENTIFY_TABS[next];
    if (tab) {
      onChange(tab);
      refs.current[tab]?.focus();
    }
  }

  return (
    <div role="tablist" aria-label={tabs.label} onKeyDown={onKeyDown} className="flex gap-1 rounded-lg bg-muted p-1">
      {IDENTIFY_TABS.map((tab) => {
        const selected = tab === value;
        return (
          <button
            key={tab}
            ref={(element) => {
              refs.current[tab] = element;
            }}
            type="button"
            role="tab"
            id={`${panelId}-${tab}`}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab)}
            className={cn(
              "h-11 flex-1 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              selected ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tabs[tab]}
          </button>
        );
      })}
    </div>
  );
}
