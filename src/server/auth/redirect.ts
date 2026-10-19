// Redirections après connexion (U04, décision 8) : uniquement vers une page du site.
// Pas d'`import "server-only"` : fonctions pures, testées sans Next.

const MAX_PATH_LENGTH = 512;

/** Chemin interne (`/…`) ou `fallback`. Refuse `//hote`, `/\hote`, les schémas et les caractères de contrôle. */
export function safeNextPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw || raw.length > MAX_PATH_LENGTH || !raw.startsWith("/")) {
    return fallback;
  }
  if (raw.startsWith("//") || raw.startsWith("/\\") || /[\u0000-\u001f\u007f\\]/.test(raw)) {
    return fallback;
  }
  // Pages de compte inutiles après connexion : retour à l'accueil.
  if (/^\/(auth|connexion|inscription)(\/|\?|$)/.test(raw)) {
    return fallback;
  }
  return raw;
}

const HOST_PATTERN = /^[a-z0-9.-]+(:\d{1,5})?$/i;

/**
 * Origine publique de la requête, pour les liens envoyés par email et le retour de Google.
 * Supabase n'accepte de toute façon que les adresses de sa liste « Redirect URLs ».
 */
export function requestOrigin(headers: Headers, fallback: string): string {
  const host = headers.get("x-forwarded-host")?.split(",")[0]?.trim() || headers.get("host")?.trim();
  if (!host || !HOST_PATTERN.test(host)) {
    return fallback;
  }
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  const proto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim() || (local ? "http" : "https");
  return `${proto === "http" ? "http" : "https"}://${host}`;
}
