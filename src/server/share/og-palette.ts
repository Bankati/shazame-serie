// Couleurs des images d'aperçu générées (Open Graph, U19). Le moteur d'images de Next (satori) ne lit pas
// les variables CSS : ces valeurs recopient les jetons de src/app/globals.css (AD-48). Fichier autorisé
// par le contrôle de design (scripts/check-design.mjs) ; toute modification des jetons doit être reportée ici.
export const OG_PALETTE = {
  inverse: "#390099",
  background: "#f8f9fa",
  foreground: "#ffffff",
  muted: "#e9e3ff",
  brand: "#9e0059",
  brandStrong: "#ffb3d6",
  primary: "#9e0059",
  veil: "rgba(28, 10, 69, 0.8)",
  veilLight: "rgba(28, 10, 69, 0.45)",
  shadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
} as const;
