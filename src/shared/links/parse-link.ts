// Analyse d'un lien de publication (U36, AD-44). Fonction pure, partagée par le serveur (seule autorité) et le
// navigateur (message immédiat). Le serveur n'ouvre jamais l'adresse donnée : il n'en garde que la plateforme et
// l'identifiant de la vidéo, puis interroge des adresses fixes (protection contre les requêtes forgées, SSRF).

export type LinkPlatform = "youtube" | "tiktok";

export type ParsedLink =
  /** Identifiant connu : l'adresse canonique est reconstruite par nous, jamais reprise de l'utilisateur. */
  | { ok: true; platform: "youtube"; videoId: string; canonicalUrl: string }
  | { ok: true; platform: "tiktok"; videoId: string; canonicalUrl: string }
  /** Lien court TikTok (`vm.tiktok.com/…`) : à résoudre par le serveur, redirections vérifiées. */
  | { ok: true; platform: "tiktok"; shortUrl: string }
  | { ok: false; reason: LinkRejection };

export type LinkRejection = "invalid" | "unsupported" | "instagram";

export const LINK_MAX_LENGTH = 2_048;

const YOUTUBE_ID = /^[\w-]{11}$/;
const TIKTOK_ID = /^\d{15,21}$/;
const TIKTOK_SHORT_CODE = /^[\w-]{5,20}$/;
const TIKTOK_AUTHOR = /^@[\w.-]{1,40}$/;

const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const TIKTOK_SHORT_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am"]);

export function parseVideoLink(raw: string): ParsedLink {
  const text = raw.trim();
  if (text === "" || text.length > LINK_MAX_LENGTH) return { ok: false, reason: "invalid" };

  let url: URL;
  try {
    // Lien collé sans protocole (« youtu.be/… ») : https par défaut.
    url = new URL(/^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text}`);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  // Ni identifiants de connexion, ni port : une adresse ordinaire de la plateforme, en https.
  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") {
    return { ok: false, reason: url.protocol === "https:" || url.protocol === "http:" ? "unsupported" : "invalid" };
  }
  const host = url.hostname.toLowerCase();

  if (host === "youtu.be") return youtube(url.pathname.split("/")[1]);
  if (YOUTUBE_HOSTS.has(host)) {
    const [, first, second] = url.pathname.split("/");
    if (first === "watch") return youtube(url.searchParams.get("v") ?? undefined);
    if (first === "shorts" || first === "live" || first === "embed") return youtube(second);
    return { ok: false, reason: "unsupported" };
  }

  if (TIKTOK_SHORT_HOSTS.has(host)) return tiktokShort(`https://${host}`, url.pathname.split("/")[1]);
  if (TIKTOK_HOSTS.has(host)) {
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "t") return tiktokShort("https://www.tiktok.com/t", parts[1]);
    return tiktokVideo(parts);
  }

  if (INSTAGRAM_HOSTS.has(host)) return { ok: false, reason: "instagram" };
  return { ok: false, reason: "unsupported" };
}

function youtube(id: string | undefined): ParsedLink {
  return id && YOUTUBE_ID.test(id)
    ? { ok: true, platform: "youtube", videoId: id, canonicalUrl: `https://www.youtube.com/watch?v=${id}` }
    : { ok: false, reason: "unsupported" };
}

/** `/@auteur/video/<id>` (l'oEmbed attend l'adresse avec son auteur) ou ancien format mobile `/v/<id>.html`. */
function tiktokVideo(parts: readonly string[]): ParsedLink {
  const [first, second, third] = parts;
  const author = first && TIKTOK_AUTHOR.test(first) && second === "video" ? first : null;
  const id = author ? third : first === "v" ? second?.replace(/\.html$/, "") : undefined;
  if (!id || !TIKTOK_ID.test(id)) return { ok: false, reason: "unsupported" };
  return { ok: true, platform: "tiktok", videoId: id, canonicalUrl: `https://www.tiktok.com/${author ?? "@"}/video/${id}` };
}

function tiktokShort(base: string, code: string | undefined): ParsedLink {
  return code && TIKTOK_SHORT_CODE.test(code)
    ? { ok: true, platform: "tiktok", shortUrl: `${base}/${code}/` }
    : { ok: false, reason: "unsupported" };
}

/** Domaines TikTok acceptés pendant la résolution d'un lien court (chaque redirection est vérifiée). */
export function isTikTokHost(host: string): boolean {
  const lower = host.toLowerCase();
  return TIKTOK_HOSTS.has(lower) || TIKTOK_SHORT_HOSTS.has(lower);
}
