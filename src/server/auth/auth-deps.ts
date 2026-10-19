import "server-only";

import { headers } from "next/headers";

import { siteUrl } from "@/lib/site-url";
import { getDb } from "@/server/db/client";
import { clientIp } from "@/server/http/rate-limit";

import { emailLimiter, loginLimiter } from "./auth-rate-limit";
import type { AuthContext, AuthDeps } from "./auth-service";
import { ensureAccount } from "./profile";
import { requestOrigin } from "./redirect";
import { createSupabaseServerClient } from "./supabase";

// Dépendances réelles de auth-service (Supabase lié aux cookies de la requête, base, limiteurs).

export function authDeps(): AuthDeps {
  return {
    auth: async () => (await createSupabaseServerClient()).auth,
    ensureAccount: (input) => ensureAccount(getDb(), input),
    loginLimiter: loginLimiter(),
    emailLimiter: emailLimiter(),
  };
}

export async function authContext(): Promise<AuthContext> {
  const requestHeaders = await headers();
  return { ip: clientIp(requestHeaders), origin: requestOrigin(requestHeaders, siteUrl()) };
}
