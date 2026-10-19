// Couleurs des images d'aperçu générées (Open Graph, U19). Le moteur d'images de Next (satori) ne lit pas
// les variables CSS : ces valeurs recopient les jetons de src/app/globals.css (AD-35). Fichier autorisé
// par le contrôle de design (scripts/check-design.mjs) ; toute modification des jetons doit être reportée ici.
export const OG_PALETTE = {
  inverse: "#05080e",
  background: "#0b0f17",
  foreground: "#ffffff",
  muted: "#d1d5db",
  brand: "#10b981",
  brandStrong: "#34d399",
  primary: "#2563eb",
  veil: "rgba(5, 8, 14, 0.78)",
  veilLight: "rgba(5, 8, 14, 0.45)",
  shadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
} as const;
