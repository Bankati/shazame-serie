import type { NextConfig } from "next";

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
};

export default nextConfig;
