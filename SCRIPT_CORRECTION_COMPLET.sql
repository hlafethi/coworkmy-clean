-- =====================================================
-- SCRIPT DE CORRECTION COMPLET - CANARD COWORKING SPACE
-- =====================================================
-- Ce script corrige tous les problèmes identifiés dans notre dernière discussion
-- Date: $(date)
-- Version: 1.0

-- =====================================================
-- 1. CORRECTION DE LA CONFIGURATION ADMIN
-- =====================================================

-- 1.1 Confirmer l'email de l'utilisateur admin
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com'
AND email_confirmed_at IS NULL;

-- 1.2 Créer ou mettre à jour le profil admin
INSERT INTO profiles (
    id,
    user_id,
    first_name,
    last_name,
    email,
    is_admin,
    created_at,
    updated_at
) 
SELECT 
    gen_random_uuid(),
    au.id,
    'Admin',
    'User',
    au.email,
    true,
    NOW(),
    NOW()
FROM auth.users au
WHERE au.email = 'sciandrea42@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.email = au.email
)
ON CONFLICT (email) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    is_admin = true,
    updated_at = NOW();

-- 1.3 S'assurer que le user_id correspond
UPDATE profiles 
SET 
    user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com'),
    updated_at = NOW()
WHERE email = 'sciandrea42@gmail.com'
AND user_id != (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- =====================================================
-- 2. CRÉATION DES TABLES DE SUPPORT MANQUANTES
-- =====================================================

-- 2.1 Créer la table support_chat_messages si elle n'existe pas
CREATE TABLE IF NOT EXISTS support_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES support_chat_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    is_admin_message BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Créer la table support_ticket_responses si elle n'existe pas
CREATE TABLE IF NOT EXISTS support_ticket_responses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    response TEXT NOT NULL,
    is_admin_response BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Ajouter les colonnes manquantes à support_tickets
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS assigned_to TEXT,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

-- =====================================================
-- 3. FONCTIONS UTILITAIRES
-- =====================================================

-- 3.1 Fonction is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$;

-- 3.2 Fonction update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3.3 Fonction get_support_chat_users
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
        COALESCE(p.full_name, 'Invité') as full_name,
        p.email,
        p.avatar_url
    FROM last_messages lm
    LEFT JOIN profiles p ON
        (lm.user_id !~ '^support_guest_' AND p.id::text = lm.user_id)
    ORDER BY lm.last_date DESC;
END;
$$;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- 4.1 Trigger pour support_faqs
DROP TRIGGER IF EXISTS update_support_faqs_updated_at ON support_faqs;
CREATE TRIGGER update_support_faqs_updated_at 
    BEFORE UPDATE ON support_faqs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4.2 Trigger pour support_chat_messages
DROP TRIGGER IF EXISTS update_support_chat_messages_updated_at ON support_chat_messages;
CREATE TRIGGER update_support_chat_messages_updated_at 
    BEFORE UPDATE ON support_chat_messages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4.3 Trigger pour support_ticket_responses
DROP TRIGGER IF EXISTS update_support_ticket_responses_updated_at ON support_ticket_responses;
CREATE TRIGGER update_support_ticket_responses_updated_at 
    BEFORE UPDATE ON support_ticket_responses 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. NETTOYAGE DES POLITIQUES RLS EXISTANTES
-- =====================================================

-- 5.1 Nettoyer les politiques support_chat_messages
DROP POLICY IF EXISTS "Admins can insert messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.support_chat_messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.support_chat_messages;

-- 5.2 Nettoyer les politiques support_chat_sessions
DROP POLICY IF EXISTS "Allow insert for owner" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow select for admin" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow select for owner" ON public.support_chat_sessions;
DROP POLICY IF EXISTS "Allow update for owner" ON public.support_chat_sessions;

-- 5.3 Nettoyer les politiques support_ticket_responses
DROP POLICY IF EXISTS "Admins can insert responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Admins can view all ticket responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir les réponses de leurs tickets" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can create responses to their tickets" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can insert their own responses" ON public.support_ticket_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.support_ticket_responses;

-- 5.4 Nettoyer les politiques support_faqs
DROP POLICY IF EXISTS "FAQ - gestion complète admin" ON support_faqs;
DROP POLICY IF EXISTS "FAQ publiques - lecture pour tous" ON support_faqs;

-- =====================================================
-- 6. CRÉATION DES NOUVELLES POLITIQUES RLS
-- =====================================================

-- 6.1 Politiques pour support_chat_messages
-- Les utilisateurs peuvent voir leurs propres messages
CREATE POLICY "Users can view their own messages" ON support_chat_messages
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id LIKE 'support_guest_%' OR 
        public.is_admin()
    );

-- Les utilisateurs peuvent insérer leurs propres messages
CREATE POLICY "Users can insert their own messages" ON support_chat_messages
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id LIKE 'support_guest_%' OR 
        public.is_admin()
    );

-- Les utilisateurs peuvent modifier leurs propres messages
CREATE POLICY "Users can update their own messages" ON support_chat_messages
    FOR UPDATE USING (
        user_id = auth.uid()::text OR 
        public.is_admin()
    );

-- 6.2 Politiques pour support_chat_sessions
-- Les utilisateurs peuvent voir leurs propres sessions
CREATE POLICY "Users can view their own sessions" ON support_chat_sessions
    FOR SELECT USING (
        user_id = auth.uid()::text OR 
        user_id LIKE 'support_guest_%' OR 
        public.is_admin()
    );

-- Les utilisateurs peuvent créer leurs propres sessions
CREATE POLICY "Users can create their own sessions" ON support_chat_sessions
    FOR INSERT WITH CHECK (
        user_id = auth.uid()::text OR 
        user_id LIKE 'support_guest_%' OR 
        public.is_admin()
    );

-- 6.3 Politiques pour support_ticket_responses
-- Les utilisateurs peuvent voir les réponses de leurs tickets
CREATE POLICY "Users can view responses to their tickets" ON support_ticket_responses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets st 
            WHERE st.id = support_ticket_responses.ticket_id 
            AND (st.user_id = auth.uid()::text OR public.is_admin())
        )
    );

-- Les utilisateurs peuvent créer des réponses à leurs tickets
CREATE POLICY "Users can create responses to their tickets" ON support_ticket_responses
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_tickets st 
            WHERE st.id = support_ticket_responses.ticket_id 
            AND (st.user_id = auth.uid()::text OR public.is_admin())
        )
    );

-- 6.4 Politiques pour support_faqs
-- Lecture publique des FAQ actives
CREATE POLICY "FAQ publiques - lecture pour tous" ON support_faqs
    FOR SELECT USING (is_active = true);

-- Gestion complète pour les admins
CREATE POLICY "FAQ - gestion complète admin" ON support_faqs
    FOR ALL USING (public.is_admin());

-- =====================================================
-- 7. CONFIGURATION REALTIME
-- =====================================================

-- 7.1 Supprimer les tables de la publication si elles existent déjà
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
    END IF;
END $$;

-- 7.2 Ajouter toutes les tables de support à la publication Realtime
DO $$
DECLARE
    table_name text;
    table_exists boolean;
    table_in_pub boolean;
BEGIN
    -- Liste des tables de support
    FOR table_name IN VALUES 
        ('support_chat_sessions'),
        ('support_chat_messages'), 
        ('support_tickets'),
        ('support_ticket_responses'),
        ('support_faqs')
    LOOP
        -- Vérifier si la table existe
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) INTO table_exists;
        
        -- Vérifier si la table est dans la publication
        SELECT EXISTS (
            SELECT FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = table_name
        ) INTO table_in_pub;
        
        -- Ajouter la table à la publication si elle existe mais n'y est pas
        IF table_exists AND NOT table_in_pub THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
            RAISE NOTICE '✅ Table % ajoutée à la publication Realtime', table_name;
        ELSIF NOT table_exists THEN
            RAISE NOTICE '❌ Table % n''existe pas', table_name;
        ELSIF table_in_pub THEN
            RAISE NOTICE '✅ Table % est déjà dans la publication Realtime', table_name;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- 8. DONNÉES PAR DÉFAUT
-- =====================================================

-- 8.1 Insérer les FAQ par défaut si elles n'existent pas
INSERT INTO support_faqs (question, answer, category, order_index, is_active)
SELECT 
    'Comment réserver un espace de coworking ?',
    'Pour réserver un espace, connectez-vous à votre compte, sélectionnez l''espace souhaité, choisissez une date et un créneau horaire disponible, puis procédez au paiement pour confirmer votre réservation.',
    'reservation',
    1,
    true
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Comment réserver un espace de coworking ?');

INSERT INTO support_faqs (question, answer, category, order_index, is_active)
SELECT 
    'Quels sont les moyens de paiement acceptés ?',
    'Nous acceptons les paiements par carte bancaire (Visa, Mastercard), PayPal, et virement bancaire pour les abonnements mensuels ou annuels.',
    'paiement',
    2,
    true
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Quels sont les moyens de paiement acceptés ?');

INSERT INTO support_faqs (question, answer, category, order_index, is_active)
SELECT 
    'Comment annuler ou modifier ma réservation ?',
    'Vous pouvez annuler ou modifier votre réservation jusqu''à 24 heures avant le début de votre créneau. Rendez-vous dans votre espace personnel, section ''Mes réservations'', et cliquez sur ''Modifier'' ou ''Annuler''.',
    'reservation',
    3,
    true
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Comment annuler ou modifier ma réservation ?');

INSERT INTO support_faqs (question, answer, category, order_index, is_active)
SELECT 
    'Les espaces sont-ils accessibles 24h/24 ?',
    'Nos espaces sont accessibles de 7h à 22h en semaine, et de 9h à 18h le week-end. Les membres avec un abonnement Premium bénéficient d''un accès 24h/24 via notre système de badge électronique.',
    'acces',
    4,
    true
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Les espaces sont-ils accessibles 24h/24 ?');

INSERT INTO support_faqs (question, answer, category, order_index, is_active)
SELECT 
    'Y a-t-il du Wi-Fi dans tous les espaces ?',
    'Oui, tous nos espaces sont équipés d''une connexion Wi-Fi fibre haut débit sécurisée. Les identifiants de connexion vous seront communiqués lors de votre arrivée.',
    'services',
    5,
    true
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Y a-t-il du Wi-Fi dans tous les espaces ?');

-- =====================================================
-- 9. VÉRIFICATIONS FINALES
-- =====================================================

-- 9.1 Vérifier la configuration admin
SELECT 
    'Configuration Admin' as section,
    au.id as auth_user_id,
    au.email as auth_user_email,
    au.email_confirmed_at,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email as profile_email,
    p.is_admin,
    CASE 
        WHEN au.id = p.user_id THEN '✅ user_id correspond'
        ELSE '❌ user_id ne correspond pas'
    END as user_id_match,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmé'
        ELSE '⚠️ Email non confirmé'
    END as status_email,
    CASE 
        WHEN p.is_admin = true THEN '✅ Admin'
        ELSE '❌ Non admin'
    END as admin_status
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email = 'sciandrea42@gmail.com';

-- 9.2 Vérifier les tables de support
SELECT 
    'Tables de Support' as section,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status
FROM (
    VALUES 
        ('support_chat_sessions'),
        ('support_chat_messages'),
        ('support_tickets'),
        ('support_ticket_responses'),
        ('support_faqs')
) AS t(table_name)
LEFT JOIN information_schema.tables ist ON ist.table_name = t.table_name AND ist.table_schema = 'public';

-- 9.3 Vérifier la configuration Realtime
SELECT 
    'Configuration Realtime' as section,
    tablename,
    CASE 
        WHEN tablename IS NOT NULL THEN '✅ Dans la publication'
        ELSE '❌ Pas dans la publication'
    END as status
FROM (
    VALUES 
        ('support_chat_sessions'),
        ('support_chat_messages'),
        ('support_tickets'),
        ('support_ticket_responses'),
        ('support_faqs')
) AS t(tablename)
LEFT JOIN pg_publication_tables ppt ON ppt.tablename = t.tablename AND ppt.pubname = 'supabase_realtime';

-- 9.4 Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as section,
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN policyname IS NOT NULL THEN '✅ Configurée'
        ELSE '❌ Manquante'
    END as status
FROM (
    VALUES 
        ('public', 'support_chat_sessions'),
        ('public', 'support_chat_messages'),
        ('public', 'support_tickets'),
        ('public', 'support_ticket_responses'),
        ('public', 'support_faqs')
) AS t(schemaname, tablename)
LEFT JOIN pg_policies pp ON pp.schemaname = t.schemaname AND pp.tablename = t.tablename;

-- 9.5 Vérifier les fonctions
SELECT 
    'Fonctions' as section,
    proname as function_name,
    CASE 
        WHEN proname IS NOT NULL THEN '✅ Existe'
        ELSE '❌ Manquante'
    END as status
FROM (
    VALUES 
        ('is_admin'),
        ('update_updated_at_column'),
        ('get_support_chat_users')
) AS t(function_name)
LEFT JOIN pg_proc pp ON pp.proname = t.function_name AND pp.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =====================================================
-- 10. NETTOYAGE DES SESSIONS
-- =====================================================

-- 10.1 Nettoyer toutes les sessions pour forcer une nouvelle authentification
DELETE FROM auth.sessions 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com');

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT '🎉 Script de correction complet terminé avec succès !' as message;
SELECT '📋 Prochaines étapes:' as next_steps;
SELECT '1. Se reconnecter à l''application' as step1;
SELECT '2. Vérifier l''accès admin' as step2;
SELECT '3. Tester le système de support' as step3;
SELECT '4. Vérifier les notifications temps réel' as step4; 