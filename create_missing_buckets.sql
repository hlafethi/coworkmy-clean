-- Script pour créer les buckets avatars et logos s'ils n'existent pas
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer le bucket AVATARS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public pour faciliter l'affichage
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Créer le bucket LOGOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  true, -- Public pour faciliter l'affichage
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. Vérifier que les buckets ont été créés
SELECT 
    'BUCKETS CRÉÉS:' as section,
    id,
    name,
    public,
    file_size_limit / 1024 / 1024 as size_limit_mb,
    allowed_mime_types
FROM storage.buckets 
WHERE id IN ('avatars', 'logos')
ORDER BY id;

SELECT 'BUCKETS AVATARS ET LOGOS PRÊTS!' as message; 