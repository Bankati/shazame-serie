import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { APP_TEXT } from "@/content/fr/app";
import { SHARE_TEXT } from "@/content/fr/share";
import type { TitlePage } from "@/server/catalog/catalog-provider";

import { OG_PALETTE as C } from "./og-palette";

// Carte d'aperçu d'une fiche (U19) : ce qu'affichent WhatsApp, Facebook, X, Messenger… quand on partage le lien.
// Format paysage 1200 × 630 (recommandé par ces services ; l'affiche seule, verticale, y était mal recadrée).
export const TITLE_CARD_SIZE = { width: 1200, height: 630 };

const TMDB_IMAGES = "https://image.tmdb.org/t/p/";
const TITLE_MAX = 60;
const OVERVIEW_MAX = 150;

// Police du site (Archivo condensée, licence OFL), en graisses 600 et 800 : la police par défaut du moteur
// d'images n'a pas de gras. Fichiers statiques (le moteur ne lit pas les polices variables), lus une fois.
const FONT_DIR = join(process.cwd(), "src", "server", "share", "fonts");
let fonts: Promise<{ name: string; data: Buffer; weight: 600 | 800; style: "normal" }[]> | undefined;

function loadFonts() {
  fonts ??= Promise.all(
    ([600, 800] as const).map(async (weight) => ({
      name: "Archivo",
      data: await readFile(join(FONT_DIR, `archivo-${weight}.ttf`)),
      weight,
      style: "normal" as const,
    })),
  );
  return fonts;
}

export async function titleCard(page: TitlePage | null): Promise<ImageResponse> {
  const { card } = SHARE_TEXT;
  const backdrop = page?.backdropPath ? `${TMDB_IMAGES}w1280${page.backdropPath}` : null;
  const poster = page?.posterPath ? `${TMDB_IMAGES}w342${page.posterPath}` : null;
  const title = page ? clip(page.title, TITLE_MAX) : card.fallbackTitle;
  const meta = page ? [page.year, card.kind[page.mediaType], ...page.genres.slice(0, 2)].filter(Boolean).join("  ·  ") : "";
  const overview = page ? clip(page.overview, OVERVIEW_MAX) : card.fallbackSubtitle;

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: C.inverse, position: "relative", fontFamily: "Archivo" }}>
        {backdrop ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backdrop} alt="" width={1200} height={630} style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, objectFit: "cover" }} />
        ) : null}
        <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", background: `linear-gradient(90deg, ${C.inverse} 0%, ${C.veil} 55%, ${C.veilLight} 100%)` }} />
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 56, padding: "0 72px", width: "100%" }}>
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={poster} alt="" width={300} height={450} style={{ width: 300, height: 450, borderRadius: 12, objectFit: "cover", boxShadow: C.shadow }} />
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", width: 44, height: 44, borderRadius: 10, background: C.brand }} />
              <span style={{ color: C.foreground, fontSize: 30, fontWeight: 800, letterSpacing: 1 }}>{APP_TEXT.name}</span>
            </div>
            <span style={{ color: C.foreground, fontSize: title.length > 30 ? 60 : 76, fontWeight: 800, lineHeight: 1.05 }}>{title}</span>
            {meta ? <span style={{ color: C.brandStrong, fontSize: 28, fontWeight: 600 }}>{meta}</span> : null}
            {overview ? <span style={{ color: C.muted, fontSize: 26, fontWeight: 600, lineHeight: 1.35 }}>{overview}</span> : null}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, color: C.muted, fontSize: 22, fontWeight: 600 }}>
              <span>{card.footer}</span>
              <span>{card.source}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...TITLE_CARD_SIZE, fonts: await loadFonts() },
  );
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}
