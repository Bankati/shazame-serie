"use client";

import Link from "next/link";

import { ErrorScreen } from "@/components/layout/error-screen";
import { Button } from "@/components/ui/button";
import { LAYOUT_TEXT } from "@/content/fr/layout";

// Les erreurs de rendu serveur sont déjà remontées à Sentry par onRequestError (instrumentation.ts).
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { error } = LAYOUT_TEXT;

  return (
    <ErrorScreen
      title={error.title}
      description={error.description}
      actions={
        <>
          <Button onClick={() => retry()} className="h-11 bg-brand px-6 text-base text-inverse hover:bg-brand/85">
            {error.retry}
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-11 border-inverse-foreground/30 bg-transparent px-6 text-base text-inverse-foreground hover:bg-inverse-foreground/10 hover:text-inverse-foreground"
          >
            <Link href="/">{error.back}</Link>
          </Button>
        </>
      }
    />
  );
}
