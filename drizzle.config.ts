import { existsSync } from "node:fs";

import { defineConfig } from "drizzle-kit";

// En local, DATABASE_URL vient de .env.local (voir .env.example). En CI et dans le workflow
// db-migrate, elle est fournie par l'environnement.
if (!process.env.DATABASE_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL manquante : copier .env.example en .env.local ou la fournir dans l'environnement.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
  // Seul le schéma public est géré ici ; auth et storage appartiennent à Supabase.
  schemaFilter: ["public"],
  strict: true,
  verbose: true,
});
