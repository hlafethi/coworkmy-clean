-- Vérifier les colonnes exactes de la table spaces
SELECT 'COLONNES DISPONIBLES' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier les colonnes obligatoires
SELECT 'COLONNES OBLIGATOIRES' as info;
SELECT 
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
AND is_nullable = 'NO'
AND column_default IS NULL
ORDER BY column_name;

-- Vérifier les colonnes avec valeurs par défaut
SELECT 'COLONNES AVEC DEFAUT' as info;
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'spaces' 
AND table_schema = 'public'
AND column_default IS NOT NULL
ORDER BY column_name; 