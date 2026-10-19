import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { env } from "@/server/env";

import { AUTH_COOKIE_OPTIONS } from "./cookies";

/** Supabase est-il configuré ? (Absent dans le build de la CI sans services : tout le monde est visiteur.) */
export function isAuthConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/**
 * Client Supabase lié aux cookies de la requête (Server Actions, route handlers, Server Components).
 * Un client par requête, jamais partagé (doc Supabase).
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase Auth non configuré (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).");
  }
  const jar = await cookies();
  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, options);
          }
        } catch {
          // Appel depuis un Server Component : écriture impossible, le proxy rafraîchit la session.
        }
      },
    },
  });
}
