import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import {
  fetchThumbnail,
  fetchTikTokMetadata,
  fetchYouTubeMetadata,
  hasClues,
  isAllowedThumbnailUrl,
  resolveTikTokShortLink,
  THUMBNAIL_MAX_BYTES,
} from "./link-metadata";

const KEY = `AIza${"x".repeat(35)}`;
const TT = "7300000000000000001";

function fakeFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => handler(String(input instanceof Request ? input.url : input), init)) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

const redirect = (location: string) => new Response(null, { status: 301, headers: { location } });

describe("resolveTikTokShortLink", () => {
  it("suit les redirections TikTok jusqu'à la vidéo, sans suivi automatique", async () => {
    const fetchImpl = fakeFetch((url) =>
      url.startsWith("https://vm.tiktok.com/") ? redirect(`https://www.tiktok.com/@auteur/video/${TT}?is_from_webapp=1`) : new Response(null, { status: 200 }),
    );
    expect(await resolveTikTokShortLink("https://vm.tiktok.com/ZMabc123/", fetchImpl)).toEqual({
      videoId: TT,
      canonicalUrl: `https://www.tiktok.com/@auteur/video/${TT}`,
    });
    expect(fetchImpl.mock.calls[0]?.[1]).toMatchObject({ redirect: "manual" });
  });

  it.each([
    ["vers un autre site", "https://evil.example/"],
    ["vers une adresse interne", "http://169.254.169.254/latest/meta-data/"],
    ["vers un faux domaine", "https://www.tiktok.com.evil.example/@a/video/1"],
  ])("redirection %s : refusée, jamais suivie", async (_label, location) => {
    const fetchImpl = fakeFetch((url) => (url.includes("vm.tiktok.com") ? redirect(location) : new Response("non")));
    expect(await resolveTikTokShortLink("https://vm.tiktok.com/ZMabc123/", fetchImpl)).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("boucle de redirections : abandon après 3 sauts", async () => {
    const fetchImpl = fakeFetch(() => redirect("https://vm.tiktok.com/ZMloop123/"));
    expect(await resolveTikTokShortLink("https://vm.tiktok.com/ZMabc123/", fetchImpl)).toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("panne réseau : null", async () => {
    const fetchImpl = fakeFetch(() => {
      throw new TypeError("réseau");
    });
    expect(await resolveTikTokShortLink("https://vm.tiktok.com/ZMabc123/", fetchImpl)).toBeNull();
  });
});

describe("fetchYouTubeMetadata", () => {
  it("adresse fixe de l'API, champs bornés, meilleure vignette", async () => {
    const fetchImpl = fakeFetch(() =>
      Response.json({
        items: [
          {
            snippet: {
              title: "Scène culte",
              description: "d".repeat(3_000),
              channelTitle: "Ciné Extraits",
              tags: Array.from({ length: 30 }, (_, index) => `tag${index}`),
              thumbnails: { high: { url: "https://i.ytimg.com/vi/x/hq.jpg" }, maxres: { url: "https://i.ytimg.com/vi/x/max.jpg" } },
            },
          },
        ],
      }),
    );
    const result = await fetchYouTubeMetadata("dQw4w9WgXcQ", KEY, fetchImpl);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toMatch(/^https:\/\/www\.googleapis\.com\/youtube\/v3\/videos\?part=snippet&id=dQw4w9WgXcQ&key=/);
    expect(result).toMatchObject({ ok: true, metadata: { title: "Scène culte", author: "Ciné Extraits", thumbnailUrl: "https://i.ytimg.com/vi/x/max.jpg" } });
    if (result.ok) {
      expect(result.metadata.description).toHaveLength(2_000);
      expect(result.metadata.tags).toHaveLength(15);
    }
  });

  it.each([
    ["vidéo privée ou supprimée", () => Response.json({ items: [] }), "not_found"],
    ["quota ou clé refusés", () => new Response("{}", { status: 403 }), "unavailable"],
    ["réponse inattendue", () => Response.json({ autre: true }), "unavailable"],
  ])("%s : %s", async (_label, handler, failure) => {
    expect(await fetchYouTubeMetadata("dQw4w9WgXcQ", KEY, fakeFetch(handler))).toEqual({ ok: false, failure });
  });

  it("sans clé : indisponible, aucun appel", async () => {
    const fetchImpl = fakeFetch(() => Response.json({}));
    expect(await fetchYouTubeMetadata("dQw4w9WgXcQ", undefined, fetchImpl)).toEqual({ ok: false, failure: "unavailable" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("fetchTikTokMetadata", () => {
  it("oEmbed public avec l'adresse canonique", async () => {
    const fetchImpl = fakeFetch(() => Response.json({ title: "Ce film 😭 #cinema", author_name: "cine", thumbnail_url: "https://p16-sign.tiktokcdn-us.com/x.jpeg" }));
    const result = await fetchTikTokMetadata(TT, `https://www.tiktok.com/@cine/video/${TT}`, fetchImpl);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe(`https://www.tiktok.com/oembed?url=${encodeURIComponent(`https://www.tiktok.com/@cine/video/${TT}`)}`);
    expect(result).toMatchObject({ ok: true, metadata: { platform: "tiktok", title: "Ce film 😭 #cinema", author: "cine" } });
  });

  it("publication introuvable : not_found", async () => {
    expect(await fetchTikTokMetadata(TT, `https://www.tiktok.com/@/video/${TT}`, fakeFetch(() => new Response("{}", { status: 400 })))).toEqual({
      ok: false,
      failure: "not_found",
    });
  });
});

describe("vignettes", () => {
  it.each([
    ["https://i.ytimg.com/vi/x/hq.jpg", "youtube", true],
    ["https://p16-sign-va.tiktokcdn.com/obj/x.jpeg", "tiktok", true],
    ["https://p77.tiktokcdn-us.com/x.jpeg", "tiktok", true],
    ["https://i.ytimg.com.evil.example/x.jpg", "youtube", false],
    ["https://evil.example/tiktokcdn.com.jpg", "tiktok", false],
    ["http://i.ytimg.com/vi/x/hq.jpg", "youtube", false],
    ["https://i.ytimg.com/vi/x/hq.jpg", "tiktok", false],
    ["https://127.0.0.1/x.jpg", "youtube", false],
  ] as const)("%s (%s) : %s", (url, platform, allowed) => {
    expect(isAllowedThumbnailUrl(url, platform)).toBe(allowed);
  });

  it("réencodée en JPEG 768 px au plus", async () => {
    const png = await sharp({ create: { width: 1280, height: 720, channels: 3, background: "#123456" } }).png().toBuffer();
    const thumbnail = await fetchThumbnail("https://i.ytimg.com/vi/x/max.jpg", "youtube", fakeFetch(() => new Response(new Uint8Array(png))));
    const metadata = await sharp(thumbnail!).metadata();
    expect(metadata).toMatchObject({ format: "jpeg", width: 768, height: 432 });
  });

  it.each([
    ["trop lourde (sans taille annoncée)", () => new Response(new Uint8Array(THUMBNAIL_MAX_BYTES + 1))],
    ["pas une image", () => new Response("<html>")],
    ["erreur HTTP", () => new Response("", { status: 404 })],
  ])("%s : null", async (_label, handler) => {
    expect(await fetchThumbnail("https://i.ytimg.com/vi/x/max.jpg", "youtube", fakeFetch(handler))).toBeNull();
  });

  it("domaine hors liste : null, aucun appel", async () => {
    const fetchImpl = fakeFetch(() => new Response(""));
    expect(await fetchThumbnail("https://evil.example/x.jpg", "youtube", fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("hasClues", () => {
  const base = { platform: "tiktok" as const, videoId: TT, title: "", description: "", author: "auteur", tags: [], thumbnailUrl: null };
  it("titre, description ou vignette ; l'auteur seul ne suffit pas", () => {
    expect(hasClues(base, null)).toBe(false);
    expect(hasClues({ ...base, title: "  " }, null)).toBe(false);
    expect(hasClues({ ...base, title: "Film : Matrix" }, null)).toBe(true);
    expect(hasClues(base, Buffer.from("x"))).toBe(true);
  });
});
