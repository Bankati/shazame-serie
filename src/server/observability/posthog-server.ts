import "server-only";

import { PostHog } from "posthog-node";

import { env } from "@/server/env";
import { log } from "@/server/log";
import { scrubEvent, stripQueryAndFragment, toEnvironment, withEnvironment } from "@/shared/observability/posthog";

// Client PostHog serveur (Node.js). Envoi immédiat et attendu : sur Vercel, la fonction peut s'arrêter
// dès la réponse envoyée (invariant 11). Sans clé de projet (local, CI, preview non configurée), rien n'est envoyé.

let client: PostHog | null | undefined;

function getClient(): PostHog | null {
  if (client === undefined) {
    const token = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
    client = token
      ? new PostHog(token, {
          host: env.NEXT_PUBLIC_POSTHOG_HOST,
          flushAt: 1,
          flushInterval: 0,
          before_send: [withEnvironment(toEnvironment(env.VERCEL_ENV)), scrubEvent],
        })
      : null;
  }
  return client;
}

export type ServerErrorContext = {
  path: string;
  method: string;
  routeType: string;
};

/**
 * Envoie une erreur serveur à PostHog Error Tracking, sans identité (aucune lecture de cookie)
 * ni paramètre d'URL. Ne lève jamais : un échec d'envoi ne doit pas masquer l'erreur d'origine.
 */
export async function captureServerError(error: unknown, context: ServerErrorContext): Promise<void> {
  const posthog = getClient();
  if (!posthog) {
    return;
  }

  try {
    await posthog.captureExceptionImmediate(error, undefined, {
      path: stripQueryAndFragment(context.path),
      method: context.method,
      route_type: context.routeType,
    });
  } catch {
    // Le suivi des erreurs ne doit jamais faire échouer la requête. On signale l'échec sans aucun détail
    // (le message pourrait contenir une donnée personnelle, invariant 9).
    log.warn("observability.posthog_send_failed");
  }
}
