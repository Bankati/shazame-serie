import "server-only";

// Code technique d'une erreur, sans son message (qui peut contenir une donnée personnelle, invariant 9) :
// code PostgreSQL (« 28P01 » = mot de passe refusé, « 57014 » = délai dépassé), code réseau (« ENOTFOUND »),
// ou nom de la classe d'erreur. Seuls des caractères sûrs sont gardés.
export function errorCode(error: unknown): string {
  const candidate =
    (typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" && error.code) ||
    (error instanceof Error && error.name) ||
    "unknown";
  return candidate.replace(/[^\w.-]/g, "").slice(0, 40) || "unknown";
}
