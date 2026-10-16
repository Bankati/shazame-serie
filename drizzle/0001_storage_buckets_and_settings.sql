-- Migration personnalisée (AD-24) : ce que drizzle-kit ne génère pas.
-- Ne jamais modifier une fois appliquée (invariant 13).

-- 1. Buckets privés (architecture.md, Storage Model). Aucune politique sur storage.objects :
--    seul le serveur (clé secrète) lit et écrit ; les lectures passent par des URL signées.
--    Les tailles et types précis des avatars et exports seront ajustés par leurs unités (U05, U26).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  -- Images d'un signalement consenti (RG8) : JPEG extraits par le navigateur, 1,5 Mo au plus (invariant 1).
  ('reports', 'reports', false, 1572864, ARRAY['image/jpeg']),
  ('avatars', 'avatars', false, NULL, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  -- Export JSON des données (RG15), supprimé par cron après 24 h.
  ('exports', 'exports', false, NULL, ARRAY['application/json'])
ON CONFLICT (id) DO NOTHING;
--> statement-breakpoint

-- 2. Réglages initiaux (AD-20), modifiables ensuite par l'admin avec journal d'audit.
INSERT INTO public.app_settings (key, value)
VALUES
  ('free_daily_quota', '15'::jsonb),
  ('visitor_daily_quota', '3'::jsonb),
  ('premium_daily_cap', '100'::jsonb),
  ('ai_daily_cap_micro_eur', '10000000'::jsonb)
ON CONFLICT (key) DO NOTHING;
