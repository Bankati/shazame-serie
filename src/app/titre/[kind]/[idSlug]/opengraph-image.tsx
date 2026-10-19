import { SHARE_TEXT } from "@/content/fr/share";
import { loadTitleRoute } from "@/server/catalog/title-route";
import { TITLE_CARD_SIZE, titleCard } from "@/server/share/title-card";

// Carte d'aperçu de la fiche (U19) : image Open Graph 1200 × 630 générée par Next, en cache comme la fiche.
export const revalidate = 86400;
export const size = TITLE_CARD_SIZE;
export const contentType = "image/png";
export const alt = SHARE_TEXT.card.fallbackTitle;

export default async function TitleOpenGraphImage({ params }: { params: Promise<{ kind: string; idSlug: string }> }) {
  const { kind, idSlug } = await params;
  const route = await loadTitleRoute(kind, idSlug);
  return await titleCard(route.status === "ok" ? route.page : null);
}
