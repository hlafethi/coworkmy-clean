-- Script de correction final pour la table FAQ

-- 1. Créer la fonction is_admin si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        -- Créer la fonction is_admin
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
        RAISE NOTICE 'Fonction is_admin() créée';
    ELSE
        RAISE NOTICE 'Fonction is_admin() existe déjà';
    END IF;
END $$;

-- 2. Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_support_faqs_updated_at ON support_faqs;

-- 3. Supprimer les politiques RLS existantes
DROP POLICY IF EXISTS "FAQ - gestion complète admin" ON support_faqs;
DROP POLICY IF EXISTS "FAQ publiques - lecture pour tous" ON support_faqs;

-- 4. Supprimer la fonction si elle existe (pour éviter les conflits)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 5. Recréer la fonction update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Recréer le trigger
CREATE TRIGGER update_support_faqs_updated_at 
    BEFORE UPDATE ON support_faqs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Recréer les politiques RLS correctement
-- Politique pour permettre la lecture à tous les utilisateurs (FAQ publiques)
CREATE POLICY "FAQ publiques - lecture pour tous" ON support_faqs
    FOR SELECT USING (is_active = true);

-- Politique pour permettre la gestion complète aux admins (utilise la fonction is_admin)
CREATE POLICY "FAQ - gestion complète admin" ON support_faqs
    FOR ALL USING (public.is_admin());

-- 8. Vérifier que la table a des données, sinon insérer les FAQ par défaut
INSERT INTO support_faqs (question, answer, category, order_index)
SELECT 
    'Comment réserver un espace de coworking ?',
    'Pour réserver un espace, connectez-vous à votre compte, sélectionnez l''espace souhaité, choisissez une date et un créneau horaire disponible, puis procédez au paiement pour confirmer votre réservation.',
    'reservation',
    1
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Comment réserver un espace de coworking ?');

INSERT INTO support_faqs (question, answer, category, order_index)
SELECT 
    'Quels sont les moyens de paiement acceptés ?',
    'Nous acceptons les paiements par carte bancaire (Visa, Mastercard), PayPal, et virement bancaire pour les abonnements mensuels ou annuels.',
    'paiement',
    2
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Quels sont les moyens de paiement acceptés ?');

INSERT INTO support_faqs (question, answer, category, order_index)
SELECT 
    'Comment annuler ou modifier ma réservation ?',
    'Vous pouvez annuler ou modifier votre réservation jusqu''à 24 heures avant le début de votre créneau. Rendez-vous dans votre espace personnel, section ''Mes réservations'', et cliquez sur ''Modifier'' ou ''Annuler''.',
    'reservation',
    3
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Comment annuler ou modifier ma réservation ?');

INSERT INTO support_faqs (question, answer, category, order_index)
SELECT 
    'Les espaces sont-ils accessibles 24h/24 ?',
    'Nos espaces sont accessibles de 7h à 22h en semaine, et de 9h à 18h le week-end. Les membres avec un abonnement Premium bénéficient d''un accès 24h/24 via notre système de badge électronique.',
    'acces',
    4
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Les espaces sont-ils accessibles 24h/24 ?');

INSERT INTO support_faqs (question, answer, category, order_index)
SELECT 
    'Y a-t-il du Wi-Fi dans tous les espaces ?',
    'Oui, tous nos espaces sont équipés d''une connexion Wi-Fi fibre haut débit sécurisée. Les identifiants de connexion vous seront communiqués lors de votre arrivée.',
    'services',
    5
WHERE NOT EXISTS (SELECT 1 FROM support_faqs WHERE question = 'Y a-t-il du Wi-Fi dans tous les espaces ?');

-- 9. Vérification finale
SELECT 'Table support_faqs corrigée avec succès' as status;
SELECT COUNT(*) as nombre_faqs FROM support_faqs;
SELECT 'Politiques RLS:' as info;
SELECT policyname, permissive, cmd, qual FROM pg_policies WHERE tablename = 'support_faqs';

-- 10. Test de la fonction is_admin
SELECT 'Test de la fonction is_admin:' as info;
SELECT public.is_admin() as is_current_user_admin; 