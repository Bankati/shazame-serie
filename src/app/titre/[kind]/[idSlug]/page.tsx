import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { TitleView } from "@/components/title/title-view";
import { TITLE_TEXT } from "@/content/fr/title";
import { loadTitleRoute } from "@/server/catalog/title-route";

// Fiche titre (U15, AD-09). Générée à la première visite puis servie depuis le cache et revalidée chaque
// jour (ISR) : aucune fiche n'est construite au build.
export const revalidate = 86400;

export function generateStaticParams(): { kind: string; idSlug: string }[] {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/titre/[kind]/[idSlug]">): Promise<Metadata> {
  const { kind, idSlug } = await params;
  const route = await loadTitleRoute(kind, idSlug);
  if (route.status !== "ok") {
    return {};
  }
  const { page } = route;
  const title = TITLE_TEXT.metadata.title(page.title, page.year);
  const description = TITLE_TEXT.metadata.description(page.overview, page.title);
  // Image d'aperçu : carte 1200 × 630 générée par opengraph-image.tsx (U19), ajoutée automatiquement par Next.
  return {
    title,
    description,
    alternates: { canonical: route.path },
    openGraph: {
      title,
      description,
      url: route.path,
      type: page.mediaType === "movie" ? "video.movie" : "video.tv_show",
    },
    // X reprend l'image Open Graph quand aucune image propre n'est déclarée.
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function TitleRoutePage({ params }: PageProps<"/titre/[kind]/[idSlug]">) {
  const { kind, idSlug } = await params;
  const route = await loadTitleRoute(kind, idSlug);
  if (route.status === "not_found") {
    notFound();
  }
  if (route.status === "redirect") {
    permanentRedirect(route.path);
  }
  return <TitleView page={route.page} />;
}
