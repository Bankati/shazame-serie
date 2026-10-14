import { loadPostHog } from "@/client/observability/posthog";

// PostHog (environ 300 Ko de JavaScript) ne doit pas ralentir l'affichage : on attend que la page soit
// chargée et que le navigateur soit au repos. Une erreur survenue avant reste visible dans les journaux
// serveur ; les pages d'erreur déclenchent elles-mêmes le chargement (reportBoundaryError).
const IDLE_TIMEOUT_MS = 5_000;

function loadWhenIdle(): void {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(() => void loadPostHog(), { timeout: IDLE_TIMEOUT_MS });
  } else {
    setTimeout(() => void loadPostHog(), 0);
  }
}

if (document.readyState === "complete") {
  loadWhenIdle();
} else {
  window.addEventListener("load", loadWhenIdle, { once: true });
}
