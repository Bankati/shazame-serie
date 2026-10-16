import type { Instrumentation } from "next";

// `env` est validé au démarrage, dans les runtimes Node.js et edge : une variable invalide empêche le serveur de démarrer.
export async function register(): Promise<void> {
  await import("./server/env");
}

// Erreurs serveur (rendu, routes, Server Actions) → PostHog Error Tracking. Runtime Node.js uniquement :
// posthog-node n'est pas chargé dans le runtime edge, inutilisé à ce jour (context/plans/OBS.md).
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }
  const { captureServerError } = await import("./server/observability/posthog-server");
  await captureServerError(error, { path: request.path, method: request.method, routeType: context.routeType });
};
