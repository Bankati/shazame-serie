"use client";

import { Clapperboard } from "lucide-react";

import { useQuota } from "@/client/identify/quota";
import { IDENTIFY_TEXT } from "@/content/fr/identify";
import { cn } from "@/lib/utils";

// Compteur de quota toujours visible (ui-context.md) : avertissement à 3 identifications restantes ou moins.
const WARNING_AT = 3;

export function QuotaCounter() {
  const quota = useQuota();
  const { counter } = IDENTIFY_TEXT;
  if (!quota) {
    return null;
  }

  return (
    <p
      aria-live="polite"
      className={cn(
        "flex items-center gap-1.5 text-sm font-medium",
        quota.remaining <= WARNING_AT ? "text-warning" : "text-muted-foreground",
      )}
    >
      <Clapperboard className="size-4" aria-hidden="true" />
      <span className="sm:hidden">{counter.short(quota.remaining)}</span>
      <span className="hidden sm:inline">{counter.full(quota.remaining)}</span>
    </p>
  );
}
