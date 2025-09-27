-- Script pour diagnostiquer et corriger la structure des données admin_settings
-- À exécuter dans l'éditeur SQL de Supabase

-- ========================================
-- 1. DIAGNOSTIC DE LA STRUCTURE ACTUELLE
-- ========================================

-- Vérifier la structure de la table
SELECT 
    'STRUCTURE TABLE:' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'admin_settings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les données actuelles
SELECT 
    'DONNÉES ACTUELLES:' as section,
    key,
    CASE 
        WHEN jsonb_typeof(value) = 'object' THEN 'JSONB Object'
        WHEN jsonb_typeof(value) = 'string' THEN 'JSONB String'
        WHEN jsonb_typeof(value) = 'array' THEN 'JSONB Array'
        ELSE 'Autre type'
    END as value_type,
    value,
    created_at,
    updated_at
FROM admin_settings 
ORDER BY key;

-- ========================================
-- 2. VÉRIFIER LES PROBLÈMES SPÉCIFIQUES
-- ========================================

-- Vérifier le site_name
SELECT 
    'SITE_NAME:' as section,
    key,
    value,
    CASE 
        WHEN key = 'site_name' AND value->>'value' IS NOT NULL THEN 'OK - Format correct'
        WHEN key = 'site_name' AND value IS NOT NULL THEN 'ATTENTION - Format incorrect'
        WHEN key = 'site_name' THEN 'ERREUR - Vide'
        ELSE 'Autre paramètre'
    END as status
FROM admin_settings 
WHERE key = 'site_name';

-- Vérifier homepage
SELECT 
    'HOMEPAGE:' as section,
    key,
    CASE 
        WHEN jsonb_typeof(value) = 'object' THEN 'OK - Format JSONB'
        ELSE 'ERREUR - Format incorrect'
    END as format_status,
    CASE 
        WHEN value->>'hero_background_image' IS NOT NULL THEN 'OK - Image définie'
        WHEN value->>'hero_background_image' IS NULL THEN 'ATTENTION - Pas d image'
        ELSE 'ERREUR - Problème'
    END as image_status,
    value->>'hero_background_image' as current_image
FROM admin_settings 
WHERE key = 'homepage';

-- ========================================
-- 3. CORRECTION DES DONNÉES SI NÉCESSAIRE
-- ========================================

-- Corriger le site_name si nécessaire
UPDATE admin_settings 
SET value = '{"value": "CoworkMy"}'::jsonb
WHERE key = 'site_name' 
AND (value->>'value' IS NULL OR value IS NULL);

-- S'assurer que homepage existe avec la bonne structure
INSERT INTO admin_settings (key, value, updated_at)
VALUES (
    'homepage',
    '{
        "title": "Bienvenue sur CoworkMy",
        "description": "Espace de coworking moderne et accessible",
        "hero_title": "Travaillez autrement, près de chez vous",
        "hero_subtitle": "Découvrez nos espaces de coworking modernes et inspirants",
        "hero_background_image": null,
        "cta_text": "Réserver maintenant",
        "features_title": "Pourquoi choisir CoworkMy ?",
        "features_subtitle": "Nous offrons bien plus qu un simple espace de travail",
        "cta_section_title": "Prêt à rejoindre notre communauté ?",
        "cta_section_subtitle": "Inscrivez-vous dès aujourd hui",
        "cta_secondary_button_text": "En savoir plus",
        "is_published": true
    }'::jsonb,
    NOW()
)
ON CONFLICT (key) DO NOTHING;

-- ========================================
-- 4. VÉRIFICATION FINALE
-- ========================================

-- Vérifier le résultat final
SELECT 
    'RÉSULTAT FINAL:' as section,
    key,
    CASE 
        WHEN key = 'site_name' AND value->>'value' IS NOT NULL THEN 'OK - Nom du site'
        WHEN key = 'homepage' AND jsonb_typeof(value) = 'object' THEN 'OK - Homepage'
        WHEN key = 'homepage' AND value->>'hero_background_image' IS NOT NULL THEN 'OK - Image définie'
        ELSE 'ATTENTION - À vérifier'
    END as status,
    CASE 
        WHEN key = 'site_name' THEN value->>'value'
        WHEN key = 'homepage' THEN value->>'hero_background_image'
        ELSE 'N/A'
    END as important_value
FROM admin_settings 
WHERE key IN ('site_name', 'homepage')
ORDER BY key;

SELECT 'DIAGNOSTIC TERMINÉ - VÉRIFIEZ LES RÉSULTATS CI-DESSUS' as message; 