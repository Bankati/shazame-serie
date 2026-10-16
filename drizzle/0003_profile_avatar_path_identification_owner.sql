-- Audit U03. Ne jamais modifier une fois appliquée (invariant 13).
-- Le bucket avatars est privé : on stocke un chemin, l'affichage passe par une URL signée.
-- Renommage écrit à la main (drizzle-kit le demande en interactif) ; le snapshot 0003 en tient compte.
ALTER TABLE "profiles" RENAME COLUMN "avatar_url" TO "avatar_path";--> statement-breakpoint
ALTER TABLE "identifications" ADD CONSTRAINT "identifications_owner_present" CHECK ("identifications"."user_id" is not null or "identifications"."visitor_key" is not null);
