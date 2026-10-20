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
  // Lecture de secours des vidéos (U33) : fichiers versionnés par leur chemin, mis en cache une fois pour toutes.
  async headers() {
    return [
      {
        source: "/ffmpeg/:dir/:file",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
