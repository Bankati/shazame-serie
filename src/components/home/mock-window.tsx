import type { ReactNode } from "react";

// Cadre de maquette (U39) : une fenêtre d'application stylisée qui montre nos vrais écrans sur la vitrine.
// Décoratif pour les lecteurs d'écran : le texte de la section dit déjà ce que la maquette montre.
export function MockWindow({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-destructive" />
          <span className="size-2.5 rounded-full bg-warning" />
          <span className="size-2.5 rounded-full bg-success" />
        </span>
        <span className="flex-1 truncate rounded-md bg-muted px-3 py-1 text-center text-xs text-muted-foreground">{title}</span>
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}
