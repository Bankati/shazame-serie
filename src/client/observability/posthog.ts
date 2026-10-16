import type { PostHog } from "posthog-js";

import {
  POSTHOG_DEFAULT_HOST,
  scrubEvent,
  shouldReportBoundaryError,
  toEnvironment,
  withEnvironment,
} from "@/shared/observability/posthog";

// PostHog navigateur (context/plans/OBS.md) : région UE, sans cookie ni stockage (pas de bandeau),
// visiteurs toujours anonymes, collecte réduite aux pages vues et aux erreurs.
// posthog-js est chargé à part, après le reste de la page, et seulement si une clé de projet existe
// (local, CI ou preview non configurée : rien n'est téléchargé ni envoyé).

let loading: Promise<PostHog | null> | undefined;

export function loadPostHog(): Promise<PostHog | null> {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) {
    return Promise.resolve(null);
  }

  loading ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(token, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || POSTHOG_DEFAULT_HOST,
      defaults: "2026-05-30",
      cookieless_mode: "always",
      person_profiles: "never",
      capture_pageview: "history_change",
      autocapture: false,
      capture_exceptions: true,
      disable_session_recording: true,
      disable_surveys: true,
      before_send: [withEnvironment(toEnvironment(process.env.NEXT_PUBLIC_VERCEL_ENV)), scrubEvent],
    });
    return posthog;
  });
  return loading;
}

/**
 * Erreur rendue par une page d'erreur (error.tsx, global-error.tsx). La capture automatique ne la voit pas
 * (elle écoute window.onerror) ; celles qui ont un digest viennent du serveur et sont déjà envoyées.
 */
export function reportBoundaryError(error: Error & { digest?: string }): void {
  if (!shouldReportBoundaryError(error)) {
    return;
  }
  void loadPostHog().then((posthog) => posthog?.captureException(error));
}
