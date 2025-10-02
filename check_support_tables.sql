-- Vérifier la structure des tables support
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('support_tickets', 'support_faqs', 'support_ticket_responses')
ORDER BY table_name, ordinal_position;

-- Vérifier les données existantes
SELECT 'support_tickets' as table_name, COUNT(*) as count FROM support_tickets
UNION ALL
SELECT 'support_faqs' as table_name, COUNT(*) as count FROM support_faqs
UNION ALL
SELECT 'support_ticket_responses' as table_name, COUNT(*) as count FROM support_ticket_responses;
