import "server-only";

// Code technique d'une erreur, sans son message (qui peut contenir une donnée personnelle, invariant 9) :
// code PostgreSQL (« 28P01 » = mot de passe refusé, « 42501 » = droits insuffisants, « 42P01 » = table
// absente, « 57014 » = délai dépassé), code réseau (« ENOTFOUND ») ou nom de la classe d'erreur.
// Drizzle enveloppe l'erreur de PostgreSQL dans une erreur sans code (`DrizzleQueryError`, propriété
// `cause`) : on descend la chaîne des causes pour trouver le code réel (constaté le 20 octobre 2026).
const MAX_DEPTH = 5;

export function errorCode(error: unknown): string {
  let current: unknown = error;
  let fallback: string | null = null;
  for (let depth = 0; depth < MAX_DEPTH && current; depth++) {
    if (typeof current === "object" && current !== null && "code" in current && typeof current.code === "string" && current.code) {
      return clean(current.code);
    }
    if (current instanceof Error && !fallback && current.name !== "Error") {
      fallback = current.name;
    }
    current = typeof current === "object" && current !== null && "cause" in current ? current.cause : null;
  }
  return clean(fallback ?? (error instanceof Error ? error.name : "unknown"));
}

function clean(value: string): string {
  return value.replace(/[^\w.-]/g, "").slice(0, 40) || "unknown";
}
