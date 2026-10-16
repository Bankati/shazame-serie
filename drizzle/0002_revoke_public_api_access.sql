-- Défense en profondeur (AD-24) : l'application n'accède à la base que côté serveur (Drizzle, rôle postgres).
-- Les rôles de l'API publique de Supabase (anon, authenticated) n'ont donc aucun droit sur le schéma public,
-- en plus de la RLS sans politique. Une table créée plus tard sans RLS resterait ainsi inaccessible.
-- Ne jamais modifier une fois appliquée (invariant 13).
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
