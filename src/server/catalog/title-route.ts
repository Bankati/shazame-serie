import "server-only";

import { cache } from "react";

import { parseTitlePath, titlePath } from "@/lib/title-url";

import type { CatalogProvider, TitlePage } from "./catalog-provider";
import { getStaticPageCatalog } from "./tmdb/tmdb-catalog";

// Résolution de /titre/{film|serie}/{tmdbId}-{slug} (AD-09) : fiche, redirection vers l'adresse canonique
// (slug ou type incorrect), ou introuvable. La page ne fait qu'appeler cette fonction (invariant 8).

export type TitleRouteResult =
  | { status: "ok"; page: TitlePage; path: string }
  | { status: "redirect"; path: string }
  | { status: "not_found" };

export async function resolveTitleRoute(catalog: CatalogProvider, kind: string, idSlug: string): Promise<TitleRouteResult> {
  const parsed = parseTitlePath(kind, idSlug);
  if (!parsed) {
    return { status: "not_found" };
  }
  const page = await catalog.getTitlePage(parsed.tmdbId, parsed.mediaType);
  if (!page) {
    return { status: "not_found" };
  }
  const canonical = titlePath(page.mediaType, page.tmdbId, page.title);
  const requested = `/titre/${kind}/${idSlug}`;
  return requested === canonical ? { status: "ok", page, path: canonical } : { status: "redirect", path: canonical };
}

/** Une seule résolution par requête, partagée entre `generateMetadata` et la page. */
export const loadTitleRoute = cache(async (kind: string, idSlug: string): Promise<TitleRouteResult> => {
  const decoded = safeDecode(idSlug);
  return decoded === null ? { status: "not_found" } : resolveTitleRoute(getStaticPageCatalog(), kind, decoded);
});

/** Adresse mal encodée (« %E0 ») : introuvable plutôt qu'une erreur 500. */
export function safeDecode(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}
