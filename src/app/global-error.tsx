"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import { LAYOUT_TEXT } from "@/content/fr/layout";

import "./globals.css";

// Remplace le layout racine en cas d'erreur : il doit poser ses propres <html>, <body> et styles.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  const text = LAYOUT_TEXT.error;

  return (
    <html lang="fr">
      <body className="flex min-h-dvh items-center justify-center bg-inverse px-4 font-sans text-inverse-foreground">
        <main className="flex max-w-prose flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-bold">{text.title}</h1>
          <p className="text-inverse-muted">{text.description}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="h-11 rounded-lg bg-brand px-6 text-base font-medium text-inverse hover:bg-brand/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {text.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
