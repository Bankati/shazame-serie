import "server-only";

import { log } from "@/server/log";

import type { CatalogProvider, ReleaseKind, ReleaseTitle } from "./catalog-provider";

/**
 * Calendrier des sorties (U42). TMDB non configuré ou en panne : null, la page affiche un état
 * d'indisponibilité au lieu d'une erreur.
 */
export async function loadReleases(
  catalog: () => CatalogProvider,
  kind: ReleaseKind,
  options: { configured: boolean },
): Promise<ReleaseTitle[] | null> {
  if (!options.configured) return null;
  try {
    return await catalog().getReleases(kind);
  } catch {
    log.warn("calendar.releases_unavailable", { kind });
    return null;
  }
}
