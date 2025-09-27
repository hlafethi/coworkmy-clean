-- Script pour créer les tables support manquantes et configurer les politiques RLS
-- Exécuter ce script dans Supabase SQL Editor

-- 1. Création de la table support_chat_messages (utilisée par le chat en ligne)
CREATE TABLE IF NOT EXISTS support_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL, -- Peut être un UUID utilisateur ou un ID invité
    message TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Création de la table support_ticket_responses (utilisée par le système de tickets)
CREATE TABLE IF NOT EXISTS support_ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Ajout de colonnes manquantes à support_tickets si nécessaire
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Mise à jour de la colonne description vers message si elle existe
UPDATE support_tickets SET message = description WHERE message IS NULL AND description IS NOT NULL;

-- 4. Création des index pour les performances
CREATE INDEX IF NOT EXISTS support_chat_messages_user_id_idx ON support_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS support_chat_messages_created_at_idx ON support_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS support_ticket_responses_ticket_id_idx ON support_ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS support_ticket_responses_user_id_idx ON support_ticket_responses(user_id);

-- 5. Suppression des anciennes politiques RLS si elles existent
DROP POLICY IF EXISTS "Users can view their own chat messages" ON support_chat_messages;
DROP POLICY IF EXISTS "Admins can view all chat messages" ON support_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own chat messages" ON support_chat_messages;
DROP POLICY IF EXISTS "Admins can insert chat messages" ON support_chat_messages;

DROP POLICY IF EXISTS "Users can view their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON support_tickets;
DROP POLICY IF EXISTS "Admins can update tickets" ON support_tickets;

DROP POLICY IF EXISTS "Users can view their ticket responses" ON support_ticket_responses;
DROP POLICY IF EXISTS "Admins can view all ticket responses" ON support_ticket_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON support_ticket_responses;
DROP POLICY IF EXISTS "Admins can insert responses" ON support_ticket_responses;

-- 6. Activation de RLS sur les tables
ALTER TABLE support_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_responses ENABLE ROW LEVEL SECURITY;

-- 7. Politiques pour support_chat_messages
-- Les utilisateurs peuvent voir leurs propres messages et ceux des admins
CREATE POLICY "Users can view their own chat messages" ON support_chat_messages
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id LIKE 'support_guest_%' OR 
        is_admin = true
    );

-- Les admins peuvent voir tous les messages
CREATE POLICY "Admins can view all chat messages" ON support_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Les utilisateurs peuvent insérer leurs propres messages
CREATE POLICY "Users can insert their own chat messages" ON support_chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id LIKE 'support_guest_%'
    );

-- Les admins peuvent insérer des messages
CREATE POLICY "Admins can insert chat messages" ON support_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- 8. Politiques pour support_tickets
-- Les utilisateurs peuvent voir leurs propres tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

-- Les admins peuvent voir tous les tickets
CREATE POLICY "Admins can view all tickets" ON support_tickets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Les utilisateurs peuvent insérer leurs propres tickets
CREATE POLICY "Users can insert their own tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Les admins peuvent mettre à jour tous les tickets
CREATE POLICY "Admins can update tickets" ON support_tickets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- 9. Politiques pour support_ticket_responses
-- Les utilisateurs peuvent voir les réponses de leurs tickets
CREATE POLICY "Users can view their ticket responses" ON support_ticket_responses
    FOR SELECT USING (
        user_id = auth.uid() OR
        ticket_id IN (
            SELECT id FROM support_tickets WHERE user_id = auth.uid()
        )
    );

-- Les admins peuvent voir toutes les réponses
CREATE POLICY "Admins can view all ticket responses" ON support_ticket_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Les utilisateurs peuvent insérer leurs propres réponses
CREATE POLICY "Users can insert their own responses" ON support_ticket_responses
    FOR INSERT WITH CHECK (
        user_id = auth.uid() AND
        ticket_id IN (
            SELECT id FROM support_tickets WHERE user_id = auth.uid()
        )
    );

-- Les admins peuvent insérer des réponses
CREATE POLICY "Admins can insert responses" ON support_ticket_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- 10. Fonction pour obtenir les utilisateurs du chat (recréation)
CREATE OR REPLACE FUNCTION get_support_chat_users()
RETURNS TABLE (
    user_id text,
    last_message text,
    last_date timestamptz,
    full_name text,
    email text,
    avatar_url text
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH last_messages AS (
        SELECT DISTINCT ON (scm.user_id)
            scm.user_id,
            scm.message as last_message,
            scm.created_at as last_date
        FROM support_chat_messages scm
        ORDER BY scm.user_id, scm.created_at DESC
    )
    SELECT 
        lm.user_id,
        lm.last_message,
        lm.last_date,
        CASE 
            WHEN lm.user_id LIKE 'support_guest_%' THEN 'Invité'
            ELSE p.full_name 
        END as full_name,
        CASE 
            WHEN lm.user_id LIKE 'support_guest_%' THEN NULL
            ELSE p.email 
        END as email,
        CASE 
            WHEN lm.user_id LIKE 'support_guest_%' THEN NULL
            ELSE p.avatar_url 
        END as avatar_url
    FROM last_messages lm
    LEFT JOIN profiles p ON p.id::text = lm.user_id
    ORDER BY lm.last_date DESC;
END;
$$;

-- 11. Permissions sur la fonction
GRANT EXECUTE ON FUNCTION get_support_chat_users() TO authenticated;
GRANT EXECUTE ON FUNCTION get_support_chat_users() TO service_role;
GRANT EXECUTE ON FUNCTION get_support_chat_users() TO anon;

-- 12. Insertion de données de test (optionnel - pour debug)
-- Un ticket de test pour vérifier que tout fonctionne
INSERT INTO support_tickets (user_id, subject, message, status, priority)
SELECT 
    u.id,
    'Ticket de test - Support système',
    'Ceci est un ticket de test pour vérifier le bon fonctionnement du système de support.',
    'open',
    'medium'
FROM users u 
WHERE u.is_admin = true 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Un message de chat de test
INSERT INTO support_chat_messages (user_id, message, is_admin, is_read)
SELECT 
    u.id::text,
    'Message de test - Support chat',
    false,
    false
FROM users u 
WHERE u.is_admin = true 
LIMIT 1
ON CONFLICT DO NOTHING;

-- Affichage des résultats
SELECT 'Tables support créées et politiques RLS configurées avec succès!' as status;
SELECT COUNT(*) as tickets_count FROM support_tickets;
SELECT COUNT(*) as chat_messages_count FROM support_chat_messages;
SELECT COUNT(*) as ticket_responses_count FROM support_ticket_responses; 