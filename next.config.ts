import type { NextConfig } from "next";

import { securityHeaders } from "./src/lib/security-headers";

// En-têtes de sécurité (U28, AD-53) : toutes les réponses, pages et API.
const SECURITY_HEADERS = securityHeaders({
  isDev: process.env.NODE_ENV === "development",
  isDeployed: process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
});

const nextConfig: NextConfig = {
  images: {
    // Affiches TMDB (code-standards.md). Servies sans l'optimiseur Vercel (facturé) : TMDB fournit déjà
    // des tailles prédéfinies (w185, w342…), voir src/lib/tmdb-image.ts.
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
  },
  // Polices de la carte d'aperçu (U19), lues à l'exécution par src/server/share/title-card.tsx : à embarquer
  // dans la fonction Vercel de la route d'image.
  outputFileTracingIncludes: {
    "/titre/**/opengraph-image": ["./src/server/share/fonts/*.ttf"],
  },
  // Lecture de secours des vidéos (U33) : fichiers versionnés par leur chemin, mis en cache une fois pour toutes.
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      {
        source: "/ffmpeg/:dir/:file",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
