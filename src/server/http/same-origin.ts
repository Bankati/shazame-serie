import "server-only";

// Protection CSRF des routes mutantes appelées par le navigateur (code-standards.md) : l'en-tête Origin,
// toujours envoyé par les navigateurs sur un POST, doit désigner le site lui-même.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }
  try {
    const host = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() || request.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
