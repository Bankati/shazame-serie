"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SUBSCRIPTION_TEXT } from "@/content/fr/subscription";

const INTERVAL_MS = 3_000;
const MAX_ATTEMPTS = 20;

// Retour de la page de paiement (U22) : le Premium est accordé par le webhook, quelques secondes plus tard. La page
// est rechargée côté serveur toutes les 3 secondes, une minute au plus ; elle cesse dès que le Premium apparaît
// (le serveur ne rend plus ce composant).
export function ActivationWatcher() {
  const router = useRouter();
  const [attempts, setAttempts] = useState(0);
  const slow = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    if (slow) return;
    const timer = window.setTimeout(() => {
      setAttempts((value) => value + 1);
      router.refresh();
    }, INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [attempts, slow, router]);

  return (
    <p
      role="status"
      className="rounded-lg border border-border bg-brand-subtle p-4 text-sm font-medium text-brand-subtle-foreground"
    >
      {slow ? SUBSCRIPTION_TEXT.welcome.slow : SUBSCRIPTION_TEXT.welcome.pending}
    </p>
  );
}
