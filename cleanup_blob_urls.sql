-- Script de nettoyage des URL blob dans toute la base de données
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Nettoyer admin_settings (toutes les colonnes JSONB)
UPDATE admin_settings 
SET value = jsonb_set(value, '{hero_background_image}', 'null', false) 
WHERE value->>'hero_background_image' LIKE 'blob:%';

UPDATE admin_settings 
SET value = jsonb_set(value, '{logo_url}', 'null', false) 
WHERE value->>'logo_url' LIKE 'blob:%';

UPDATE admin_settings 
SET value = jsonb_set(value, '{favicon_url}', 'null', false) 
WHERE value->>'favicon_url' LIKE 'blob:%';

-- 2. Nettoyer homepage_settings (toutes les colonnes JSONB)
UPDATE homepage_settings 
SET value = jsonb_set(value, '{hero_background_image}', 'null', false) 
WHERE value->>'hero_background_image' LIKE 'blob:%';

UPDATE homepage_settings 
SET value = jsonb_set(value, '{logo_url}', 'null', false) 
WHERE value->>'logo_url' LIKE 'blob:%';

-- 3. Nettoyer profiles (avatar_url)
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url LIKE 'blob:%';

-- 4. Nettoyer spaces (image_url)
UPDATE spaces 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- 5. Nettoyer documents (file_url)
UPDATE documents 
SET file_url = NULL 
WHERE file_url LIKE 'blob:%';

-- 6. Nettoyer carousel_images (image_url)
UPDATE carousel_images 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- 7. Vérification finale - chercher toute URL blob restante
SELECT 'admin_settings' as table_name, key, value 
FROM admin_settings 
WHERE value::text LIKE '%blob:%';

SELECT 'homepage_settings' as table_name, key, value 
FROM homepage_settings 
WHERE value::text LIKE '%blob:%';

SELECT 'profiles' as table_name, id, avatar_url 
FROM profiles 
WHERE avatar_url LIKE 'blob:%';

SELECT 'spaces' as table_name, id, image_url 
FROM spaces 
WHERE image_url LIKE 'blob:%';

SELECT 'documents' as table_name, id, file_url 
FROM documents 
WHERE file_url LIKE 'blob:%';

SELECT 'carousel_images' as table_name, id, image_url 
FROM carousel_images 
WHERE image_url LIKE 'blob:%'; 