import "server-only";

import { type AttemptLimiter, buildLimiter } from "@/server/http/attempt-limiter";

export { type AttemptLimiter, createMemoryLimiter } from "@/server/http/attempt-limiter";

// Limitation de débit des formulaires de compte, par adresse IP (CDC 18.1, context/plans/U04.md décision 7) :
// 20 tentatives de connexion par heure ; 5 envois d'email (inscription, mot de passe oublié) par heure.
// Redis en production ; en local et en CI (sans Upstash), compteur en mémoire du processus.

export const LOGIN_ATTEMPTS_PER_HOUR = 20;
export const EMAIL_SENDS_PER_HOUR = 5;

let login: AttemptLimiter | undefined;
let email: AttemptLimiter | undefined;

export function loginLimiter(): AttemptLimiter {
  login ??= buildLimiter("auth:login", LOGIN_ATTEMPTS_PER_HOUR);
  return login;
}

export function emailLimiter(): AttemptLimiter {
  email ??= buildLimiter("auth:email", EMAIL_SENDS_PER_HOUR);
  return email;
}
