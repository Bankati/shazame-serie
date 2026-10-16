import Image from "next/image";

import { LAYOUT_TEXT } from "@/content/fr/layout";
import { TITLE_TEXT } from "@/content/fr/title";

// Mention obligatoire de TMDB sur chaque fiche (invariant 12, conditions TMDB section 3 : logo et mention).
export function SourceAttribution() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:gap-4">
      <Image src="/brand/tmdb-logo.svg" alt={TITLE_TEXT.sources.logo} width={137} height={18} unoptimized />
      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
        <p>{TITLE_TEXT.sources.data}</p>
        <p>{LAYOUT_TEXT.footer.tmdbNotice}</p>
      </div>
    </div>
  );
}
