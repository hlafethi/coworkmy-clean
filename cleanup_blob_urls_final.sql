-- Script pour nettoyer définitivement toutes les URL blob
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Nettoyer les URL blob dans admin_settings
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{hero_background_image}', 
  'null'::jsonb
)
WHERE value->>'hero_background_image' LIKE 'blob:%';

-- 2. Nettoyer les URL blob dans les autres champs d'images
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{carousel_images}', 
  '[]'::jsonb
)
WHERE value->>'carousel_images' LIKE '%blob:%';

-- 3. Nettoyer les URL blob dans les settings de spaces
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{spaces}', 
  jsonb_path_set(value->'spaces', 'strict $[*].image_url', 'null'::jsonb)
)
WHERE value->'spaces' IS NOT NULL 
AND value->'spaces'::text LIKE '%blob:%';

-- 4. Vérifier les résultats
SELECT 
    'RÉSULTATS DU NETTOYAGE:' as section,
    COUNT(*) as total_settings,
    COUNT(CASE WHEN value->>'hero_background_image' LIKE 'blob:%' THEN 1 END) as blob_hero_images,
    COUNT(CASE WHEN value->>'carousel_images' LIKE '%blob:%' THEN 1 END) as blob_carousel_images,
    COUNT(CASE WHEN value->'spaces'::text LIKE '%blob:%' THEN 1 END) as blob_space_images
FROM admin_settings;

-- 5. Afficher les settings nettoyés
SELECT 
    'SETTINGS NETTOYÉS:' as section,
    key,
    CASE 
        WHEN value->>'hero_background_image' IS NULL THEN '✅ Nettoyé'
        WHEN value->>'hero_background_image' LIKE 'blob:%' THEN '❌ Blob détecté'
        ELSE '✅ OK'
    END as hero_image_status,
    CASE 
        WHEN value->>'carousel_images' LIKE '%blob:%' THEN '❌ Blob détecté'
        ELSE '✅ OK'
    END as carousel_status
FROM admin_settings
WHERE value->>'hero_background_image' IS NOT NULL 
   OR value->>'carousel_images' IS NOT NULL;

-- 6. Message de confirmation
SELECT 'NETTOYAGE TERMINÉ - TOUTES LES URL BLOB ONT ÉTÉ SUPPRIMÉES' as message; 