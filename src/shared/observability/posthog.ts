// Réglages PostHog communs au serveur et au navigateur (context/plans/OBS.md).
// Invariant 9 : aucune identité, aucun email, aucun paramètre d'URL ne part vers PostHog.
// Le filtre `scrubEvent` est la dernière barrière avant l'envoi ; la collecte est déjà réduite à la source.

/** Région UE (décision OBS). */
export const POSTHOG_DEFAULT_HOST = "https://eu.i.posthog.com";

/** Environnement affiché sur chaque événement (preview / production / development). */
const ENVIRONMENTS = ["development", "preview", "production"] as const;
export type ObservabilityEnvironment = (typeof ENVIRONMENTS)[number];

/** Valeur de VERCEL_ENV (ou NEXT_PUBLIC_VERCEL_ENV) ; toute valeur inconnue ou absente vaut « development ». */
export function toEnvironment(value: string | undefined): ObservabilityEnvironment {
  return ENVIRONMENTS.find((environment) => environment === value) ?? "development";
}

/**
 * Une erreur rendue par error.tsx avec un `digest` vient du serveur : onRequestError l'a déjà envoyée.
 * Seules les erreurs nées dans le navigateur (sans digest) sont envoyées depuis la page d'erreur.
 */
export function shouldReportBoundaryError(error: Error & { digest?: string }): boolean {
  return error.digest === undefined;
}

// Forme minimale commune aux événements de posthog-js (CaptureResult) et posthog-node (CaptureEvent).
type ScrubbableEvent = {
  properties?: Record<string, unknown> | undefined;
  $set?: Record<string, unknown> | undefined;
  $set_once?: Record<string, unknown> | undefined;
};

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EMAIL_PLACEHOLDER = "[email]";

// Propriétés d'URL renseignées automatiquement par PostHog : on n'en garde que l'origine et le chemin.
const URL_PROPERTIES = ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer", "$prev_pageview_url"];

export function redactEmails(text: string): string {
  return text.replace(EMAIL_PATTERN, EMAIL_PLACEHOLDER);
}

export function stripQueryAndFragment(url: string): string {
  return url.split(/[?#]/, 1)[0] ?? "";
}

export function scrubEvent<T extends ScrubbableEvent>(event: T | null): T | null {
  if (!event) {
    return null;
  }

  // Jamais de profil de personne (utilisateur PostHog toujours anonyme).
  delete event.$set;
  delete event.$set_once;

  const properties = event.properties;
  if (!properties) {
    return event;
  }

  for (const key of URL_PROPERTIES) {
    const value = properties[key];
    if (typeof value === "string") {
      properties[key] = stripQueryAndFragment(value);
    }
  }

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === "string") {
      properties[key] = redactEmails(value);
    }
  }

  const exceptions = properties.$exception_list;
  if (Array.isArray(exceptions)) {
    for (const exception of exceptions as { value?: unknown }[]) {
      if (typeof exception.value === "string") {
        exception.value = redactEmails(exception.value);
      }
    }
  }

  return event;
}

/** Ajoute l'environnement à chaque événement, avant le filtre. */
export function withEnvironment<T extends ScrubbableEvent>(environment: ObservabilityEnvironment) {
  return (event: T | null): T | null => {
    if (event) {
      event.properties = { ...event.properties, environment };
    }
    return event;
  };
}
