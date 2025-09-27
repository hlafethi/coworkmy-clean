-- Script pour corriger les URLs blob en base de données
-- Remplace les URLs blob par une URL d'image par défaut

-- Mettre à jour les paramètres homepage qui contiennent des URLs blob
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{hero_background_image}', 
  '"https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"'
)
WHERE key = 'homepage' 
AND value->>'hero_background_image' LIKE 'blob:%';

-- Vérifier le résultat
SELECT key, value->>'hero_background_image' as hero_background_image 
FROM admin_settings 
WHERE key = 'homepage'; 