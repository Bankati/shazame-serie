import { Clapperboard } from "lucide-react";
import Link from "next/link";

import { APP_TEXT } from "@/content/fr/app";
import { LAYOUT_TEXT } from "@/content/fr/layout";
import { cn } from "@/lib/utils";

type LogoProps = {
  /** `inverse` sur les surfaces sombres (pied de page). */
  tone?: "default" | "inverse";
  className?: string;
};

export function Logo({ tone = "default", className }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label={`${APP_TEXT.name}, ${LAYOUT_TEXT.homeLinkLabel}`}
      className={cn(
        "inline-flex min-h-11 items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-md bg-brand text-inverse">
        <Clapperboard className="size-5" aria-hidden="true" />
      </span>
      <span
        className={cn(
          "font-display text-xl font-bold",
          tone === "inverse" ? "text-inverse-foreground" : "text-foreground",
        )}
      >
        {APP_TEXT.name}
      </span>
    </Link>
  );
}
