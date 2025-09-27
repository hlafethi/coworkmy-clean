-- Activation des publications Realtime pour les FAQ (version simplifiée)

-- Ajouter la table support_faqs à la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE support_faqs;

-- Vérifier que la table a été ajoutée
SELECT 'Table support_faqs ajoutée à la publication Realtime' as status;

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

-- Vérifier les données FAQ
SELECT 'Données FAQ:' as info;
SELECT COUNT(*) as nombre_faqs FROM support_faqs;
SELECT 'FAQ actives:' as info;
SELECT COUNT(*) as faq_actives FROM support_faqs WHERE is_active = true; 