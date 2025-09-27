-- Vérification de la structure de la table spaces
-- Identifier les colonnes exactes disponibles

-- 1. Vérifier toutes les colonnes de la table spaces
SELECT 'STRUCTURE COMPLÈTE TABLE SPACES' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de la table
SELECT 'CONTRAINTES TABLE SPACES' as section;
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'spaces' 
AND table_schema = 'public';

-- 3. Vérifier les colonnes liées aux prix
SELECT 'COLONNES PRIX' as section;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
AND column_name LIKE '%price%'
ORDER BY column_name;

-- 4. Vérifier les colonnes liées à Stripe
SELECT 'COLONNES STRIPE' as section;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
AND column_name LIKE '%stripe%'
ORDER BY column_name;

-- 5. Afficher un exemple d'enregistrement
SELECT 'EXEMPLE D ENREGISTREMENT' as section;
SELECT 
    *
FROM spaces 
LIMIT 1;

-- 6. Vérifier les colonnes obligatoires pour la création
SELECT 'COLONNES OBLIGATOIRES' as section;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
AND is_nullable = 'NO'
AND column_default IS NULL
ORDER BY column_name; 