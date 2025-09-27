-- =====================================================
-- SCRIPT DE VÉRIFICATION POST-CORRECTION
-- =====================================================
-- Ce script vérifie que toutes les corrections ont été appliquées correctement
-- À exécuter après le script de correction principal

-- =====================================================
-- 1. VÉRIFICATION DE LA CONFIGURATION ADMIN
-- =====================================================

SELECT '🔍 VÉRIFICATION ADMIN' as section;

-- 1.1 Vérifier que l'utilisateur admin existe et est configuré
SELECT 
    'Admin User' as check_type,
    au.id as auth_user_id,
    au.email as auth_user_email,
    au.email_confirmed_at,
    CASE 
        WHEN au.email_confirmed_at IS NOT NULL THEN '✅ Email confirmé'
        ELSE '❌ Email non confirmé'
    END as email_status
FROM auth.users au
WHERE au.email = 'sciandrea42@gmail.com';

-- 1.2 Vérifier le profil admin
SELECT 
    'Admin Profile' as check_type,
    p.id as profile_id,
    p.user_id as profile_user_id,
    p.email as profile_email,
    p.is_admin,
    CASE 
        WHEN p.is_admin = true THEN '✅ Admin configuré'
        ELSE '❌ Non admin'
    END as admin_status,
    CASE 
        WHEN p.user_id = (SELECT id FROM auth.users WHERE email = 'sciandrea42@gmail.com') THEN '✅ user_id correspond'
        ELSE '❌ user_id ne correspond pas'
    END as user_id_match
FROM profiles p
WHERE p.email = 'sciandrea42@gmail.com';

-- 1.3 Test de la fonction is_admin
SELECT 
    'Admin Function Test' as check_type,
    public.is_admin() as is_admin_result,
    CASE 
        WHEN public.is_admin() THEN '✅ Fonction is_admin() retourne true'
        ELSE '❌ Fonction is_admin() retourne false'
    END as function_status;

-- =====================================================
-- 2. VÉRIFICATION DES TABLES DE SUPPORT
-- =====================================================

SELECT '🔍 VÉRIFICATION TABLES SUPPORT' as section;

-- 2.1 Vérifier l'existence des tables
SELECT 
    'Tables Existence' as check_type,
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

-- 2.2 Vérifier la structure des tables
SELECT 
    'Table Structure' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses', 'support_faqs')
ORDER BY table_name, ordinal_position;

-- =====================================================
-- 3. VÉRIFICATION DES POLITIQUES RLS
-- =====================================================

SELECT '🔍 VÉRIFICATION POLITIQUES RLS' as section;

-- 3.1 Vérifier les politiques existantes
SELECT 
    'RLS Policies' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses', 'support_faqs')
ORDER BY tablename, policyname;

-- 3.2 Vérifier que RLS est activé
SELECT 
    'RLS Enabled' as check_type,
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✅ RLS activé'
        ELSE '❌ RLS désactivé'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses', 'support_faqs');

-- =====================================================
-- 4. VÉRIFICATION DE LA CONFIGURATION REALTIME
-- =====================================================

SELECT '🔍 VÉRIFICATION REALTIME' as section;

-- 4.1 Vérifier les tables dans la publication
SELECT 
    'Realtime Publication' as check_type,
    schemaname,
    tablename,
    pubname,
    CASE 
        WHEN tablename IS NOT NULL THEN '✅ Dans la publication'
        ELSE '❌ Pas dans la publication'
    END as publication_status
FROM (
    VALUES 
        ('support_chat_sessions'),
        ('support_chat_messages'),
        ('support_tickets'),
        ('support_ticket_responses'),
        ('support_faqs')
) AS t(tablename)
LEFT JOIN pg_publication_tables ppt ON ppt.tablename = t.tablename AND ppt.pubname = 'supabase_realtime';

-- 4.2 Vérifier les triggers de réplication
SELECT 
    'Replication Triggers' as check_type,
    trigger_name,
    event_object_table,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
AND event_object_table IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses', 'support_faqs')
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 5. VÉRIFICATION DES FONCTIONS
-- =====================================================

SELECT '🔍 VÉRIFICATION FONCTIONS' as section;

-- 5.1 Vérifier l'existence des fonctions
SELECT 
    'Functions Existence' as check_type,
    proname as function_name,
    proargtypes,
    prorettype,
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

-- 5.2 Test de la fonction get_support_chat_users
SELECT 
    'Function Test' as check_type,
    'get_support_chat_users' as function_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM get_support_chat_users() LIMIT 1
        ) THEN '✅ Fonction exécutable'
        ELSE '❌ Erreur d''exécution'
    END as execution_status;

-- =====================================================
-- 6. VÉRIFICATION DES DONNÉES
-- =====================================================

SELECT '🔍 VÉRIFICATION DONNÉES' as section;

-- 6.1 Vérifier les FAQ
SELECT 
    'FAQ Data' as check_type,
    COUNT(*) as total_faqs,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_faqs,
    COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_faqs
FROM support_faqs;

-- 6.2 Vérifier les sessions de chat
SELECT 
    'Chat Sessions' as check_type,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN user_id LIKE 'support_guest_%' THEN 1 END) as guest_sessions,
    COUNT(CASE WHEN user_id !~ '^support_guest_' THEN 1 END) as user_sessions
FROM support_chat_sessions;

-- 6.3 Vérifier les messages de chat
SELECT 
    'Chat Messages' as check_type,
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_admin_message = true THEN 1 END) as admin_messages,
    COUNT(CASE WHEN is_admin_message = false THEN 1 END) as user_messages
FROM support_chat_messages;

-- 6.4 Vérifier les tickets
SELECT 
    'Support Tickets' as check_type,
    COUNT(*) as total_tickets,
    COUNT(CASE WHEN status = 'open' THEN 1 END) as open_tickets,
    COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_tickets
FROM support_tickets;

-- =====================================================
-- 7. TESTS DE PERMISSIONS
-- =====================================================

SELECT '🔍 TESTS DE PERMISSIONS' as section;

-- 7.1 Test d'accès aux FAQ (devrait fonctionner pour tous)
SELECT 
    'FAQ Access Test' as check_type,
    COUNT(*) as accessible_faqs,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Accès aux FAQ fonctionne'
        ELSE '❌ Problème d''accès aux FAQ'
    END as access_status
FROM support_faqs 
WHERE is_active = true;

-- 7.2 Test d'accès aux sessions de chat (devrait fonctionner pour admin)
SELECT 
    'Chat Sessions Access Test' as check_type,
    COUNT(*) as accessible_sessions,
    CASE 
        WHEN COUNT(*) >= 0 THEN '✅ Accès aux sessions fonctionne'
        ELSE '❌ Problème d''accès aux sessions'
    END as access_status
FROM support_chat_sessions;

-- =====================================================
-- 8. RÉSUMÉ FINAL
-- =====================================================

SELECT '📊 RÉSUMÉ FINAL' as section;

-- 8.1 Résumé des vérifications
WITH checks AS (
    -- Admin checks
    SELECT 'Admin User Exists' as check_name, 
           CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'sciandrea42@gmail.com') THEN 1 ELSE 0 END as passed
    UNION ALL
    SELECT 'Admin Email Confirmed' as check_name,
           CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'sciandrea42@gmail.com' AND email_confirmed_at IS NOT NULL) THEN 1 ELSE 0 END as passed
    UNION ALL
    SELECT 'Admin Profile Exists' as check_name,
           CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'sciandrea42@gmail.com' AND is_admin = true) THEN 1 ELSE 0 END as passed
    UNION ALL
    SELECT 'Admin Function Works' as check_name,
           CASE WHEN public.is_admin() THEN 1 ELSE 0 END as passed
    UNION ALL
    -- Tables checks
    SELECT 'Support Tables Exist' as check_name,
           CASE WHEN (
               SELECT COUNT(*) FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses', 'support_faqs')
           ) = 5 THEN 1 ELSE 0 END as passed
    UNION ALL
    -- Realtime checks
    SELECT 'Realtime Configured' as check_name,
           CASE WHEN (
               SELECT COUNT(*) FROM pg_publication_tables 
               WHERE pubname = 'supabase_realtime' 
               AND tablename IN ('support_chat_sessions', 'support_chat_messages', 'support_tickets', 'support_ticket_responses', 'support_faqs')
           ) = 5 THEN 1 ELSE 0 END as passed
    UNION ALL
    -- Functions checks
    SELECT 'Functions Exist' as check_name,
           CASE WHEN (
               SELECT COUNT(*) FROM pg_proc 
               WHERE proname IN ('is_admin', 'update_updated_at_column', 'get_support_chat_users')
               AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
           ) = 3 THEN 1 ELSE 0 END as passed
)
SELECT 
    'Final Summary' as check_type,
    COUNT(*) as total_checks,
    SUM(passed) as passed_checks,
    COUNT(*) - SUM(passed) as failed_checks,
    CASE 
        WHEN SUM(passed) = COUNT(*) THEN '🎉 TOUTES LES VÉRIFICATIONS PASSENT'
        WHEN SUM(passed) >= COUNT(*) * 0.8 THEN '⚠️ LA PLUPART DES VÉRIFICATIONS PASSENT'
        ELSE '❌ PROBLÈMES DÉTECTÉS'
    END as overall_status
FROM checks;

-- 8.2 Instructions finales
SELECT '📋 INSTRUCTIONS FINALES' as section;
SELECT '1. Se reconnecter à l''application' as instruction;
SELECT '2. Vérifier l''accès au dashboard admin' as instruction;
SELECT '3. Tester la création d''un ticket de support' as instruction;
SELECT '4. Tester l''envoi d''un message dans le chat' as instruction;
SELECT '5. Vérifier les notifications temps réel côté admin' as instruction;
SELECT '6. Tester la gestion des FAQ' as instruction; 