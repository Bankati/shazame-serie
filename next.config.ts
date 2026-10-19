import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Affiches TMDB (code-standards.md). Servies sans l'optimiseur Vercel (facturé) : TMDB fournit déjà
    // des tailles prédéfinies (w185, w342…), voir src/lib/tmdb-image.ts.
    remotePatterns: [new URL("https://image.tmdb.org/t/p/**")],
  },
};

export default nextConfig;
