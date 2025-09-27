-- Script pour corriger les publications Realtime des FAQ
-- Évite les erreurs de doublons dans les publications

-- 1. Vérifier les publications existantes
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'support_faqs';

-- 2. Supprimer la table de la publication si elle existe déjà
DO $$
BEGIN
    -- Supprimer support_faqs de la publication si elle existe
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_faqs'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE support_faqs;
        RAISE NOTICE 'Table support_faqs supprimée de la publication supabase_realtime';
    ELSE
        RAISE NOTICE 'Table support_faqs n''était pas dans la publication supabase_realtime';
    END IF;
END $$;

-- 3. Ajouter la table à la publication
ALTER PUBLICATION supabase_realtime ADD TABLE support_faqs;

-- 4. Vérifier que l'ajout a fonctionné
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'support_faqs';

-- 5. Vérifier que la table support_faqs existe et a les bonnes colonnes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_faqs' 
ORDER BY ordinal_position;

-- 6. Vérifier les triggers de réplication
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'support_faqs'; 