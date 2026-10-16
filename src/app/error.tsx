"use client";

import Link from "next/link";
import { useEffect } from "react";

import { reportBoundaryError } from "@/client/observability/posthog";
import { ErrorScreen } from "@/components/layout/error-screen";
import { Button } from "@/components/ui/button";
import { LAYOUT_TEXT } from "@/content/fr/layout";

// Une erreur attrapée par cette page n'atteint pas la capture automatique de PostHog (window.onerror) :
// on l'envoie ici. Les erreurs serveur (avec digest) sont déjà envoyées par onRequestError (instrumentation.ts).
export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    reportBoundaryError(error);
  }, [error]);

  const text = LAYOUT_TEXT.error;

  return (
    <ErrorScreen
      title={text.title}
      description={text.description}
      actions={
        <>
          <Button onClick={() => retry()} className="h-11 bg-brand px-6 text-base text-inverse hover:bg-brand/85">
            {text.retry}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 border-inverse-foreground/30 bg-transparent px-6 text-base text-inverse-foreground hover:bg-inverse-foreground/10 hover:text-inverse-foreground"
          >
            <Link href="/">{text.back}</Link>
          </Button>
        </>
      }
    />
  );
}
