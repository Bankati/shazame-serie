// Réglages des cookies de session Supabase, partagés par le proxy et le client serveur.
// Pas d'`import "server-only"` : ce fichier est aussi chargé par `src/proxy.ts`. Aucune valeur secrète ici.

/**
 * RG9 (30 jours d'inactivité) : chaque rafraîchissement du jeton (au plus une fois par heure d'activité)
 * réécrit le cookie avec cette durée. Sans activité pendant 30 jours, le navigateur l'efface et la session
 * est perdue. Le réglage « inactivity timeout » de Supabase (plan payant) le double côté serveur.
 */
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

// HttpOnly : aucun client Supabase ne tourne dans le navigateur, tout passe par le serveur (architecture.md).
export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: SESSION_MAX_AGE_S,
} as const;

/** Cookies de session Supabase : `sb-<ref>-auth-token`, éventuellement découpé en `.0`, `.1`… */
export function isAuthCookie(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}
