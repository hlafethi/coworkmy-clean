-- Script pour nettoyer les URL blob et vérifier le nom du site
-- À exécuter dans l'éditeur SQL de Supabase

-- ========================================
-- 1. NETTOYAGE DES URL BLOB
-- ========================================

-- Nettoyer les URL blob dans admin_settings
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{hero_background_image}', 
  'null'::jsonb
)
WHERE value->>'hero_background_image' LIKE 'blob:%';

-- Nettoyer les URL blob dans les carousel_images
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{carousel_images}', 
  '[]'::jsonb
)
WHERE value->>'carousel_images' LIKE '%blob:%';

-- ========================================
-- 2. VÉRIFIER LE NOM DU SITE
-- ========================================

-- Afficher l'état actuel du site_name
SELECT 
    'ÉTAT ACTUEL SITE_NAME:' as section,
    key,
    value,
    CASE 
        WHEN key = 'site_name' AND value->>'value' IS NOT NULL THEN '✅ OK (value.value)'
        WHEN key = 'site_name' AND value IS NOT NULL THEN '⚠️ Direct value'
        WHEN key = 'site_name' THEN '❌ Vide'
        ELSE 'Autre paramètre'
    END as status
FROM admin_settings 
WHERE key = 'site_name';

-- ========================================
-- 3. CORRIGER LE NOM DU SITE SI NÉCESSAIRE
-- ========================================

-- Si le site_name n'existe pas, le créer
INSERT INTO admin_settings (key, value, updated_at)
VALUES (
    'site_name',
    '{"value": "CoworkMy"}'::jsonb,
    NOW()
)
ON CONFLICT (key) DO NOTHING;

-- Si le site_name existe mais pas dans le bon format, le corriger
UPDATE admin_settings 
SET value = '{"value": "CoworkMy"}'::jsonb
WHERE key = 'site_name' 
AND (value->>'value' IS NULL OR value IS NULL);

-- ========================================
-- 4. VÉRIFICATIONS FINALES
-- ========================================

-- Vérifier le résultat final
SELECT 
    'RÉSULTAT FINAL:' as section,
    key,
    value,
    CASE 
        WHEN key = 'site_name' AND value->>'value' IS NOT NULL THEN '✅ Nom du site OK'
        WHEN key = 'homepage' AND value->>'hero_background_image' LIKE 'blob:%' THEN '❌ URL blob détectée'
        WHEN key = 'homepage' AND value->>'hero_background_image' IS NULL THEN '✅ Image nettoyée'
        ELSE '✅ OK'
    END as status
FROM admin_settings 
WHERE key IN ('site_name', 'homepage');

-- Compter les URL blob restantes
SELECT 
    'COMPTAGE URL BLOB:' as section,
    COUNT(CASE WHEN value->>'hero_background_image' LIKE 'blob:%' THEN 1 END) as blob_hero_images,
    COUNT(CASE WHEN value->>'carousel_images' LIKE '%blob:%' THEN 1 END) as blob_carousel_images
FROM admin_settings;

SELECT 'NETTOYAGE ET CORRECTION TERMINÉS - LE NOM DU SITE ET LES IMAGES SONT PRÊTS !' as message; 