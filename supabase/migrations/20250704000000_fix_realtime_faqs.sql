-- Migration pour corriger les publications Realtime des FAQ
-- Évite les erreurs de doublons dans les publications

-- Supprimer la table de la publication si elle existe déjà
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

-- Ajouter la table à la publication
ALTER PUBLICATION supabase_realtime ADD TABLE support_faqs;

-- Vérifier que l'ajout a fonctionné
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'support_faqs'; 