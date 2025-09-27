-- Activation des publications Realtime pour les FAQ (version finale)

-- Vérifier si la publication existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Créer la publication si elle n'existe pas
        CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
        RAISE NOTICE 'Publication supabase_realtime créée';
    ELSE
        RAISE NOTICE 'Publication supabase_realtime existe déjà';
    END IF;
END $$;

-- Ajouter la table support_faqs à la publication (ignore si déjà présente)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'support_faqs') THEN
        RAISE NOTICE 'Table support_faqs déjà dans la publication';
    ELSE
        ALTER PUBLICATION supabase_realtime ADD TABLE support_faqs;
        RAISE NOTICE 'Table support_faqs ajoutée à la publication';
    END IF;
END $$;

-- Vérifier les tables dans la publication
SELECT 'Tables dans la publication Realtime:' as info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- Vérifier spécifiquement la table support_faqs
SELECT 'Vérification support_faqs:' as info;
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'support_faqs';

-- Vérifier que la table support_faqs existe et a des données
SELECT 'Données FAQ:' as info;
SELECT COUNT(*) as nombre_faqs FROM support_faqs;
SELECT 'FAQ actives:' as info;
SELECT COUNT(*) as faq_actives FROM support_faqs WHERE is_active = true; 