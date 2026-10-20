import { describe, expect, it } from "vitest";

import { isTikTokHost, parseVideoLink } from "./parse-link";

const YT = "dQw4w9WgXcQ";
const TT = "7300000000000000001";

describe("parseVideoLink — YouTube", () => {
  it.each([
    `https://www.youtube.com/watch?v=${YT}`,
    `https://youtube.com/watch?v=${YT}&t=42s`,
    `https://m.youtube.com/watch?v=${YT}`,
    `https://music.youtube.com/watch?v=${YT}`,
    `https://www.youtube.com/shorts/${YT}`,
    `https://www.youtube.com/live/${YT}?si=abc`,
    `https://www.youtube.com/embed/${YT}`,
    `https://youtu.be/${YT}?si=partage`,
    `youtu.be/${YT}`,
    `  https://www.youtube.com/watch?v=${YT}  `,
  ])("%s", (link) => {
    expect(parseVideoLink(link)).toEqual({ ok: true, platform: "youtube", videoId: YT, canonicalUrl: `https://www.youtube.com/watch?v=${YT}` });
  });
});

describe("parseVideoLink — TikTok", () => {
  it("vidéo : identifiant et auteur gardés", () => {
    expect(parseVideoLink(`https://www.tiktok.com/@cinephile.fr/video/${TT}?lang=fr`)).toEqual({
      ok: true,
      platform: "tiktok",
      videoId: TT,
      canonicalUrl: `https://www.tiktok.com/@cinephile.fr/video/${TT}`,
    });
    expect(parseVideoLink(`https://m.tiktok.com/v/${TT}.html`)).toMatchObject({ ok: true, videoId: TT });
  });

  it.each([
    ["https://vm.tiktok.com/ZMabc123/", "https://vm.tiktok.com/ZMabc123/"],
    ["https://vt.tiktok.com/ZSxyz789", "https://vt.tiktok.com/ZSxyz789/"],
    ["https://www.tiktok.com/t/ZTRabc12/", "https://www.tiktok.com/t/ZTRabc12/"],
  ])("lien court %s : à résoudre, adresse reconstruite", (link, shortUrl) => {
    expect(parseVideoLink(link)).toEqual({ ok: true, platform: "tiktok", shortUrl });
  });
});

describe("parseVideoLink — refus", () => {
  it.each([
    ["Instagram", "https://www.instagram.com/reel/Cabc123/", "instagram"],
    ["Instagram court", "https://instagr.am/p/Cabc123/", "instagram"],
    ["autre site", "https://vimeo.com/123456", "unsupported"],
    ["faux domaine (suffixe)", `https://youtube.com.evil.example/watch?v=${YT}`, "unsupported"],
    ["faux domaine (préfixe)", `https://evilyoutube.com/watch?v=${YT}`, "unsupported"],
    ["identifiants de connexion", `https://www.youtube.com@evil.example/watch?v=${YT}`, "unsupported"],
    ["utilisateur sur le bon domaine", `https://user:pass@www.youtube.com/watch?v=${YT}`, "unsupported"],
    ["port", `https://www.youtube.com:8443/watch?v=${YT}`, "unsupported"],
    ["http", `http://www.youtube.com/watch?v=${YT}`, "unsupported"],
    ["adresse IP", "https://127.0.0.1/watch?v=dQw4w9WgXcQ", "unsupported"],
    ["identifiant YouTube trop court", "https://youtu.be/abc", "unsupported"],
    ["page de chaîne", "https://www.youtube.com/@chaine", "unsupported"],
    ["identifiant TikTok non numérique", "https://www.tiktok.com/@a/video/abc", "unsupported"],
    ["profil TikTok", "https://www.tiktok.com/@auteur", "unsupported"],
    ["javascript:", "javascript:alert(1)", "invalid"],
    ["fichier", "file:///etc/passwd", "invalid"],
    ["vide", "   ", "invalid"],
    ["trop long", `https://youtu.be/${YT}?${"a".repeat(2_100)}`, "invalid"],
  ])("%s : %s", (_label, link, reason) => {
    expect(parseVideoLink(link)).toEqual({ ok: false, reason });
  });
});

describe("isTikTokHost", () => {
  it("seulement les domaines TikTok exacts", () => {
    expect(isTikTokHost("www.tiktok.com")).toBe(true);
    expect(isTikTokHost("vm.tiktok.com")).toBe(true);
    expect(isTikTokHost("tiktok.com.evil.example")).toBe(false);
    expect(isTikTokHost("eviltiktok.com")).toBe(false);
  });
});
