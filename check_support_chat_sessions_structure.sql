-- Vérifier la structure de la table support_chat_sessions
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'support_chat_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Vérifier aussi les contraintes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.support_chat_sessions'::regclass; 