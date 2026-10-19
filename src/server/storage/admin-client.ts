import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/server/env";

// Client Supabase à clé secrète (U05) : seul le serveur lit et écrit dans les buckets privés (aucune
// politique sur storage.objects, AD-24). Jamais dans un composant client ni une variable NEXT_PUBLIC_*.
let client: SupabaseClient | null | undefined;

/** Client à clé secrète, ou null si Supabase n'est pas configuré (CI sans pile locale). */
export function getStorageAdmin(): SupabaseClient | null {
  if (client === undefined) {
    client =
      env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SECRET_KEY
        ? createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
        : null;
  }
  return client;
}
