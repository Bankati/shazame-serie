import "server-only";

import sharp from "sharp";
import { z } from "zod";

import { isTikTokHost, type LinkPlatform, parseVideoLink } from "@/shared/links/parse-link";

// Métadonnées publiques d'une publication (U36, AD-37, AD-44) : uniquement par des adresses fixes des
// plateformes (YouTube Data API v3, oEmbed TikTok), jamais par l'adresse donnée par l'utilisateur. Aucune vidéo
// n'est téléchargée ; la vignette ne vient que des domaines d'images des plateformes.

export type LinkMetadata = {
  platform: LinkPlatform;
  videoId: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  thumbnailUrl: string | null;
};

export type MetadataFailure = "not_found" | "unavailable";
export type MetadataResult = { ok: true; metadata: LinkMetadata } | { ok: false; failure: MetadataFailure };

type Fetch = typeof fetch;

const REQUEST_TIMEOUT_MS = 5_000;
const MAX_SHORT_LINK_HOPS = 3;
const MAX_DESCRIPTION_CHARS = 2_000;
const MAX_TAGS = 15;
export const THUMBNAIL_MAX_BYTES = 2 * 1024 * 1024;
const THUMBNAIL_MAX_SIZE_PX = 768;

const YOUTUBE_IMAGE_HOSTS = new Set(["i.ytimg.com", "i9.ytimg.com", "img.youtube.com"]);
const TIKTOK_IMAGE_SUFFIXES = [".tiktokcdn.com", ".tiktokcdn-us.com", ".tiktokcdn-eu.com"];

/**
 * Lien court TikTok : on suit les redirections une à une (`redirect: "manual"`), chacune en https sur un domaine
 * TikTok exact, jusqu'à une adresse de vidéo reconnue. Toute sortie de TikTok est refusée.
 */
export async function resolveTikTokShortLink(shortUrl: string, fetchImpl: Fetch = fetch): Promise<{ videoId: string; canonicalUrl: string } | null> {
  let current = shortUrl;
  try {
    for (let hop = 0; hop < MAX_SHORT_LINK_HOPS; hop++) {
      const url = new URL(current);
      if (url.protocol !== "https:" || url.port !== "" || url.username !== "" || !isTikTokHost(url.hostname)) {
        return null;
      }
      const response = await fetchImpl(url, { method: "HEAD", redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      const location = response.headers.get("location");
      if (response.status < 300 || response.status >= 400 || !location) {
        return null;
      }
      const next = new URL(location, url);
      const parsed = parseVideoLink(next.href);
      if (parsed.ok && parsed.platform === "tiktok" && "videoId" in parsed) {
        return { videoId: parsed.videoId, canonicalUrl: parsed.canonicalUrl };
      }
      current = next.href;
    }
  } catch {
    // Délai dépassé, réseau, adresse illisible : lien non résolu.
  }
  return null;
}

const youtubeResponseSchema = z.object({
  items: z.array(
    z.object({
      snippet: z.object({
        title: z.string(),
        description: z.string().default(""),
        channelTitle: z.string().default(""),
        tags: z.array(z.string()).default([]),
        thumbnails: z.record(z.string(), z.object({ url: z.string() })).default({}),
      }),
    }),
  ),
});

export async function fetchYouTubeMetadata(videoId: string, apiKey: string | undefined, fetchImpl: Fetch = fetch): Promise<MetadataResult> {
  if (!apiKey) return { ok: false, failure: "unavailable" };
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);
  try {
    const response = await fetchImpl(url, { redirect: "error", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return { ok: false, failure: response.status === 404 ? "not_found" : "unavailable" };
    const parsed = youtubeResponseSchema.safeParse(await response.json());
    if (!parsed.success) return { ok: false, failure: "unavailable" };
    const snippet = parsed.data.items[0]?.snippet;
    if (!snippet) return { ok: false, failure: "not_found" };
    const thumbnails = snippet.thumbnails;
    const thumbnail = thumbnails.maxres ?? thumbnails.standard ?? thumbnails.high ?? thumbnails.medium ?? thumbnails.default;
    return {
      ok: true,
      metadata: {
        platform: "youtube",
        videoId,
        title: snippet.title,
        description: snippet.description.slice(0, MAX_DESCRIPTION_CHARS),
        author: snippet.channelTitle,
        tags: snippet.tags.slice(0, MAX_TAGS),
        thumbnailUrl: thumbnail?.url ?? null,
      },
    };
  } catch {
    return { ok: false, failure: "unavailable" };
  }
}

const tiktokResponseSchema = z.object({
  title: z.string().default(""),
  author_name: z.string().default(""),
  thumbnail_url: z.string().optional(),
});

export async function fetchTikTokMetadata(videoId: string, canonicalUrl: string, fetchImpl: Fetch = fetch): Promise<MetadataResult> {
  const url = new URL("https://www.tiktok.com/oembed");
  url.searchParams.set("url", canonicalUrl);
  try {
    const response = await fetchImpl(url, { redirect: "error", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!response.ok) return { ok: false, failure: response.status === 400 || response.status === 404 ? "not_found" : "unavailable" };
    const parsed = tiktokResponseSchema.safeParse(await response.json());
    if (!parsed.success) return { ok: false, failure: "unavailable" };
    return {
      ok: true,
      metadata: {
        platform: "tiktok",
        videoId,
        // La légende TikTok sert de titre ; les mots-dièse en font partie.
        title: parsed.data.title.slice(0, MAX_DESCRIPTION_CHARS),
        description: "",
        author: parsed.data.author_name,
        tags: [],
        thumbnailUrl: parsed.data.thumbnail_url ?? null,
      },
    };
  } catch {
    return { ok: false, failure: "unavailable" };
  }
}

/** La vignette ne vient que des domaines d'images de la plateforme, en https, sans redirection. */
export function isAllowedThumbnailUrl(raw: string, platform: LinkPlatform): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.port !== "" || url.username !== "" || url.password !== "") return false;
  const host = url.hostname.toLowerCase();
  return platform === "youtube" ? YOUTUBE_IMAGE_HOSTS.has(host) : TIKTOK_IMAGE_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

/**
 * Vignette téléchargée (2 Mo au plus), décodée et réencodée en JPEG 768 px : le type réel est vérifié par le
 * décodage. Tout échec rend null : l'IA travaillera alors sur le texte seul.
 */
export async function fetchThumbnail(raw: string | null, platform: LinkPlatform, fetchImpl: Fetch = fetch): Promise<Buffer | null> {
  if (!raw || !isAllowedThumbnailUrl(raw, platform)) return null;
  try {
    const response = await fetchImpl(raw, { redirect: "error", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    const declared = Number(response.headers.get("content-length") ?? "0");
    if (!response.ok || declared > THUMBNAIL_MAX_BYTES) return null;
    const bytes = await readAtMost(response, THUMBNAIL_MAX_BYTES);
    if (!bytes || bytes.length === 0) return null;
    return await sharp(bytes, { limitInputPixels: 40_000_000 })
      .resize(THUMBNAIL_MAX_SIZE_PX, THUMBNAIL_MAX_SIZE_PX, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch {
    return null;
  }
}

/** Lit le corps en flux et abandonne au-delà de `limit` octets (taille annoncée absente ou fausse). */
async function readAtMost(response: Response, limit: number): Promise<Buffer | null> {
  if (!response.body) return null;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/** Assez d'indices pour interroger l'IA ? Un titre ou une description non vides, ou une vignette. */
export function hasClues(metadata: LinkMetadata, thumbnail: Buffer | null): boolean {
  return metadata.title.trim() !== "" || metadata.description.trim() !== "" || thumbnail !== null;
}
