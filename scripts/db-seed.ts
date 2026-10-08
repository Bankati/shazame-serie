// Seed de la base LOCALE uniquement (npm run db:seed) : 1 admin + 1 utilisateur.
// Les comptes Auth passent par l'API d'administration Supabase ; les profils par Drizzle.
// Refuse toute base qui n'est pas sur la machine locale.
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { profiles } from "../src/server/db/schema";

const LOCAL_HOSTS = new Set(["127.0.0.1", "localhost"]);
// Mot de passe de développement, valable seulement sur la pile locale.
const LOCAL_PASSWORD = process.env.SEED_PASSWORD ?? "motdepasse-local";

const SEED_ACCOUNTS = [
  { email: "admin@local.test", displayName: "Admin local", role: "admin" },
  { email: "utilisateur@local.test", displayName: "Utilisateur local", role: "user" },
] as const;

function requireLocal(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} manquante (voir .env.example).`);
  if (!LOCAL_HOSTS.has(new URL(value).hostname)) {
    throw new Error(`${name} ne pointe pas vers la machine locale : seed refusé.`);
  }
  return value;
}

async function main() {
  const databaseUrl = requireLocal("DATABASE_URL");
  const supabaseUrl = requireLocal("NEXT_PUBLIC_SUPABASE_URL");
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) throw new Error("SUPABASE_SECRET_KEY manquante (voir .env.example).");

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const client = postgres(databaseUrl, { max: 1 });
  const db = drizzle(client);

  try {
    const { data: existing, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    for (const account of SEED_ACCOUNTS) {
      let userId = existing.users.find((user) => user.email === account.email)?.id;
      if (!userId) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: LOCAL_PASSWORD,
          email_confirm: true,
        });
        if (error) throw error;
        userId = data.user.id;
      }

      await db
        .insert(profiles)
        .values({ id: userId, displayName: account.displayName, role: account.role })
        .onConflictDoUpdate({ target: profiles.id, set: { displayName: account.displayName, role: account.role } });

      console.log(`Compte prêt : ${account.email} (${account.role})`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Seed impossible :", error instanceof Error ? error.message : error);
  process.exit(1);
});
