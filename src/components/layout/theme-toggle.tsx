"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { LAYOUT_TEXT } from "@/content/fr/layout";

const noop = () => () => {};

// Bascule clair / sombre (AD-49). Le choix est gardé par next-themes (stockage du navigateur) et appliqué avant
// l'affichage, sans flash. Les icônes suivent la classe `.dark` en CSS ; le libellé n'est connu qu'après
// l'hydratation (le serveur ignore le choix), d'où un libellé neutre jusque-là.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const dark = hydrated && resolvedTheme === "dark";
  const { theme } = LAYOUT_TEXT;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? theme.toLight : theme.toDark}
      title={dark ? theme.toLight : theme.toDark}
      className="size-11 shrink-0 text-muted-foreground hover:text-foreground"
    >
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-5 dark:block" aria-hidden="true" />
    </Button>
  );
}
