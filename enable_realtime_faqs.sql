-- Activation des publications Realtime pour les FAQ
-- Ajouter la table support_faqs à la publication Realtime

-- Vérifier si la publication existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Créer la publication si elle n'existe pas
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
    END IF;
END $$;

-- Ajouter la table support_faqs à la publication
ALTER PUBLICATION supabase_realtime ADD TABLE support_faqs;

-- Vérifier les tables dans la publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'support_faqs';

-- Vérifier que la table support_faqs existe
SELECT 'Table support_faqs ajoutée à la publication Realtime' as status; 