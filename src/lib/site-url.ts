// Adresse publique du site, pour les URL canoniques, Open Graph, robots.txt et sitemap.xml.
// NEXT_PUBLIC_SITE_URL (domaine définitif, D8) l'emporte ; sinon l'adresse de production Vercel
// (variable système exposée par Vercel) ; en local, localhost.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  return vercel ? `https://${vercel}` : "http://localhost:3000";
}
