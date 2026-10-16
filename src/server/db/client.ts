import "server-only";

import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/server/env";

import * as schema from "./schema";

// Client applicatif (architecture.md : accès base uniquement côté serveur, via Drizzle).
// Sur Vercel, DATABASE_URL vise le pooler Supabase en mode transaction : requêtes préparées désactivées
// (library-docs.md). Une seule connexion par instance de fonction suffit et ménage le pooler.
const MAX_CONNECTIONS = 1;
const CONNECT_TIMEOUT_S = 10;
/** Délai maximal d'une requête applicative : au-delà, PostgreSQL l'annule (erreur 57014). */
export const QUERY_TIMEOUT_MS = 5_000;

export type Database = PostgresJsDatabase<typeof schema>;
export type DbTransaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

let database: Database | undefined;

export function getDb(): Database {
  if (!database) {
    if (!env.DATABASE_URL) {
      throw new Error("DATABASE_URL manquante : base de données indisponible (voir .env.example).");
    }
    const client = postgres(env.DATABASE_URL, {
      prepare: false,
      max: MAX_CONNECTIONS,
      connect_timeout: CONNECT_TIMEOUT_S,
      onnotice: () => {},
    });
    database = drizzle(client, { schema });
  }
  return database;
}

/**
 * Exécute des requêtes avec un délai maximal. Le pooler Supabase en mode transaction ignore les réglages
 * envoyés à la connexion (statement_timeout y reste à 2 min, vérifié le 15 octobre 2026) : le délai est donc
 * posé dans la transaction (`SET LOCAL`), seule méthode fiable avec ce pooler.
 * Ne jamais y placer d'appel externe long (IA, TMDB) : la transaction garderait une connexion ouverte.
 */
export function withQueryTimeout<T>(
  db: Database,
  work: (tx: DbTransaction) => Promise<T>,
  timeoutMs: number = QUERY_TIMEOUT_MS,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql.raw(`set local statement_timeout = ${Math.trunc(timeoutMs)}`));
    return work(tx);
  });
}
