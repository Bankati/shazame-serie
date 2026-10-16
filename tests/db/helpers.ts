import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import postgres from "postgres";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquante : démarrer Supabase (npm run db:start) et remplir .env.local.`);
  return value;
}

/** Connexion PostgreSQL directe (superutilisateur local) pour préparer et inspecter la base. */
export function adminSql() {
  return postgres(required("DATABASE_URL"), { max: 1, onnotice: () => {} });
}

const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };

/** Client avec la clé publique, comme un navigateur. */
export function publicClient(): SupabaseClient {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), clientOptions);
}

/** Client avec la clé secrète (contourne la RLS) : uniquement pour préparer les données de test. */
export function secretClient(): SupabaseClient {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), clientOptions);
}

/** Les 13 tables de architecture.md (Storage Model). */
export const EXPECTED_TABLES = [
  "admin_audit_log",
  "ai_spend_daily",
  "app_settings",
  "billing_events",
  "consents",
  "data_exports",
  "identifications",
  "profiles",
  "reports",
  "result_cache",
  "result_cache_frames",
  "subscriptions",
  "watchlist_items",
] as const;

export const PRIVATE_BUCKETS = ["avatars", "exports", "reports"] as const;
