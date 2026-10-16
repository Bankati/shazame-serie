import "server-only";

import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import { env } from "@/server/env";

// Visiteur sans compte (architecture.md, RG2) : cookie `visitor_id` signé (HMAC-SHA256), HttpOnly, 1 an.
// Il ne contient qu'un identifiant aléatoire et ne sert qu'au quota visiteur.

export const VISITOR_COOKIE = "visitor_id";
const ONE_YEAR_S = 365 * 24 * 60 * 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const VISITOR_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax",
  path: "/",
  maxAge: ONE_YEAR_S,
} as const;

// Sans secret configuré (local, CI) : secret temporaire, les cookies changent à chaque redémarrage.
// En production, env.ts exige VISITOR_COOKIE_SECRET.
let ephemeralSecret: string | undefined;

function secret(): string {
  if (env.VISITOR_COOKIE_SECRET) {
    return env.VISITOR_COOKIE_SECRET;
  }
  ephemeralSecret ??= randomBytes(32).toString("base64url");
  return ephemeralSecret;
}

function signature(id: string, key: string): string {
  return createHmac("sha256", key).update(id).digest("base64url");
}

export function newVisitorId(): string {
  return randomUUID();
}

export function signVisitorId(id: string, key: string = secret()): string {
  return `${id}.${signature(id, key)}`;
}

/** Identifiant du visiteur si le cookie est intact, sinon null (cookie absent, modifié ou d'un autre secret). */
export function verifyVisitorCookie(value: string | undefined, key: string = secret()): string | null {
  if (!value) {
    return null;
  }
  const [id, mac] = value.split(".");
  if (!id || !mac || !UUID_PATTERN.test(id)) {
    return null;
  }
  const expected = Buffer.from(signature(id, key));
  const received = Buffer.from(mac);
  return expected.length === received.length && timingSafeEqual(expected, received) ? id : null;
}
