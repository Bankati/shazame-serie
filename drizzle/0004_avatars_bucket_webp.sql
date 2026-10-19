-- Migration personnalisée (U05) : photos de profil. Le serveur réencode toute photo en WebP 256 × 256
-- (quelques dizaines de Ko) ; le bucket n'accepte donc plus que ce format, 512 Ko au plus.
-- Ne jamais modifier une fois appliquée (invariant 13).
UPDATE storage.buckets
SET file_size_limit = 524288, allowed_mime_types = ARRAY['image/webp']
WHERE id = 'avatars';
