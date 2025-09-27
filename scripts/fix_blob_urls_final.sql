-- Script final pour corriger toutes les URLs blob en base de données
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Corriger les URLs blob dans admin_settings
UPDATE admin_settings 
SET value = jsonb_set(
  value, 
  '{hero_background_image}', 
  '"https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80"'
)
WHERE key = 'homepage' 
AND (
  value->>'hero_background_image' LIKE 'blob:%' 
  OR value->>'hero_background_image' LIKE '%localhost%'
  OR value->>'hero_background_image' IS NULL
);

-- 2. Corriger les URLs blob dans les colonnes individuelles
UPDATE admin_settings 
SET homepage_title = COALESCE(homepage_title, 'CoWorkMy')
WHERE key = 'homepage' AND (homepage_title IS NULL OR homepage_title = '');

UPDATE admin_settings 
SET homepage_hero_title = COALESCE(homepage_hero_title, 'Travaillez autrement, près de chez vous')
WHERE key = 'homepage' AND (homepage_hero_title IS NULL OR homepage_hero_title = '');

UPDATE admin_settings 
SET homepage_hero_subtitle = COALESCE(homepage_hero_subtitle, 'Découvrez notre solution de coworking moderne et inspirante')
WHERE key = 'homepage' AND (homepage_hero_subtitle IS NULL OR homepage_hero_subtitle = '');

UPDATE admin_settings 
SET homepage_hero_background_image = 'https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'
WHERE key = 'homepage' AND (
  homepage_hero_background_image LIKE 'blob:%' 
  OR homepage_hero_background_image LIKE '%localhost%'
  OR homepage_hero_background_image IS NULL
);

UPDATE admin_settings 
SET homepage_cta_text = COALESCE(homepage_cta_text, 'Réservez votre journée dès maintenant')
WHERE key = 'homepage' AND (homepage_cta_text IS NULL OR homepage_cta_text = '');

UPDATE admin_settings 
SET homepage_cta_secondary_button_text = COALESCE(homepage_cta_secondary_button_text, 'Nous contacter')
WHERE key = 'homepage' AND (homepage_cta_secondary_button_text IS NULL OR homepage_cta_secondary_button_text = '');

-- 3. Vérifier les corrections
SELECT 
  key,
  value->>'hero_background_image' as hero_background_image,
  homepage_hero_background_image,
  homepage_title,
  homepage_hero_title,
  homepage_cta_text,
  homepage_cta_secondary_button_text
FROM admin_settings 
WHERE key = 'homepage'; 