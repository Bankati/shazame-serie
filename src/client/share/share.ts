"use client";

// Partage d'un lien (U19) : partage natif du téléphone (Web Share API) quand il existe, sinon copie du lien.
// Fonction pure à dépendances injectées : testée sans navigateur.

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

export type ShareEnv = {
  share?: (data: { title: string; text: string; url: string }) => Promise<void>;
  canShare?: (data: { url: string }) => boolean;
  copy?: (text: string) => Promise<void>;
};

export function browserShareEnv(): ShareEnv {
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  return {
    share: nav?.share ? (data) => nav.share(data) : undefined,
    canShare: nav?.canShare ? (data) => nav.canShare(data) : undefined,
    copy: nav?.clipboard ? (text) => nav.clipboard.writeText(text) : undefined,
  };
}

export async function shareLink(data: { title: string; text: string; url: string }, env: ShareEnv = browserShareEnv()): Promise<ShareOutcome> {
  if (env.share && (!env.canShare || env.canShare({ url: data.url }))) {
    try {
      await env.share(data);
      return "shared";
    } catch (error) {
      // La personne a fermé la feuille de partage : rien à signaler.
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Partage refusé (contexte non sécurisé, autorisation) : on tente la copie.
    }
  }
  if (!env.copy) return "failed";
  try {
    await env.copy(data.url);
    return "copied";
  } catch {
    return "failed";
  }
}
