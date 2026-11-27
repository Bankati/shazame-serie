// En-têtes de sécurité de toutes les réponses (U28, CDC 18.1, code-standards.md). Fonction pure, lue par
// next.config.ts au build : aucune dépendance au reste de l'application (ni env.ts, ni server-only).
//
// CSP sans nonce (AD-53, à valider) : une CSP à nonce rend toutes les pages dynamiques (doc Next 16.4,
// « Content Security Policy ») et ferait perdre l'ISR des fiches et la vitrine statique ; la variante SRI est
// expérimentale et ne couvre pas les scripts en ligne de Next. Les scripts en ligne restent donc permis ; le reste
// de la politique (origines, cadres, formulaires, plugins, base) est strict.

export type SecurityHeaderOptions = {
  /** `next dev` : React a besoin d'eval pour ses piles d'erreurs, et le site est servi en http. */
  isDev: boolean;
  /** Déploiement Vercel (préproduction ou production) : https obligatoire. */
  isDeployed: boolean;
  /** Origine Supabase (photos de profil et images de signalement par liens signés, connexion Google). */
  supabaseUrl?: string;
  /** Hôte d'envoi PostHog (UE par défaut). */
  posthogHost?: string;
};

export type Header = { key: string; value: string };

const DEFAULT_POSTHOG_HOST = "https://eu.i.posthog.com";

/** Origine `scheme://hôte[:port]` d'une adresse, ou null si elle est absente ou invalide. */
function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/** Hôte des scripts complémentaires de PostHog (`eu.i.posthog.com` → `eu-assets.i.posthog.com`). */
function posthogAssetsOrigin(apiOrigin: string): string | null {
  const { protocol, hostname } = new URL(apiOrigin);
  const match = /^(eu|us)\.i\.posthog\.com$/.exec(hostname);
  return match ? `${protocol}//${match[1]}-assets.i.posthog.com` : null;
}

export function contentSecurityPolicy(options: SecurityHeaderOptions): string {
  const supabase = originOf(options.supabaseUrl);
  const posthog = originOf(options.posthogHost) ?? DEFAULT_POSTHOG_HOST;
  const posthogAssets = posthogAssetsOrigin(posthog);
  const list = (...sources: (string | null | false)[]) => sources.filter(Boolean).join(" ");

  const directives: Record<string, string> = {
    "default-src": "'self'",
    // 'unsafe-inline' : scripts en ligne de Next (charge RSC) sans nonce (AD-53). 'wasm-unsafe-eval' : ffmpeg.wasm
    // (U33). 'unsafe-eval' : heic-to/next (U34) construit des fonctions à l'exécution ; à retirer en passant à
    // heic-to/csp une fois vérifié avec une vraie photo HEIC.
    "script-src": list("'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", posthogAssets),
    // Styles en ligne : Motion, next/font, attributs style de React.
    "style-src": "'self' 'unsafe-inline'",
    // blob: aperçus des images extraites ; data: petites icônes ; TMDB affiches et logos ; Supabase liens signés.
    "img-src": list("'self'", "data:", "blob:", "https://image.tmdb.org", supabase),
    "media-src": "'self' blob:",
    "font-src": "'self' data:",
    "connect-src": list("'self'", "blob:", posthog, posthogAssets, options.isDev && "ws:"),
    "frame-src": "https://www.youtube-nocookie.com",
    // Worker de ffmpeg.wasm servi par le site ; heic-to crée ses workers depuis des blob:.
    "worker-src": "'self' blob:",
    "manifest-src": "'self'",
    "object-src": "'none'",
    "base-uri": "'self'",
    // Formulaires qui redirigent vers le paiement, le portail client et la connexion Google (via Supabase).
    "form-action": list("'self'", "https://checkout.stripe.com", "https://billing.stripe.com", "https://accounts.google.com", supabase),
    "frame-ancestors": "'none'",
  };
  const policy = Object.entries(directives).map(([name, value]) => `${name} ${value}`);
  if (options.isDeployed) policy.push("upgrade-insecure-requests");
  return policy.join("; ");
}

export function securityHeaders(options: SecurityHeaderOptions): Header[] {
  const headers: Header[] = [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(options) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // Doublon de frame-ancestors pour les navigateurs anciens.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ];
  // HSTS seulement en https (CDC 18.1) : deux ans, sous-domaines compris. Pas de « preload » tant que le domaine
  // définitif n'est pas choisi (D8) : l'inscription à la liste est difficile à défaire.
  if (options.isDeployed) headers.push({ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" });
  return headers;
}
