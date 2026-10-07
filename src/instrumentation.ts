import * as Sentry from "@sentry/nextjs";

// `env` est importé par les configurations Sentry : une variable manquante empêche le serveur de démarrer.
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
