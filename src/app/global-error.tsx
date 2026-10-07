"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { APP_TEXT } from "@/content/fr/app";

// Remplace le layout racine en cas d'erreur : signale l'erreur à Sentry. Mise en forme en U02.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <h1>{APP_TEXT.globalError.title}</h1>
        <button type="button" onClick={() => retry()}>
          {APP_TEXT.globalError.retry}
        </button>
      </body>
    </html>
  );
}
