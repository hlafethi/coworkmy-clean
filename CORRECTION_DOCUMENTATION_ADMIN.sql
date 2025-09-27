-- =====================================================
-- CORRECTION DOCUMENTATION ADMIN - CENTRE D'ASSISTANCE
-- =====================================================
-- Script pour corriger et améliorer la gestion de la documentation
-- dans le centre d'assistance admin

-- =====================================================
-- 1. VÉRIFICATION ET CRÉATION DE LA TABLE
-- =====================================================

-- 1.1 Vérifier si la table support_kb_articles existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'support_kb_articles'
    ) THEN
        -- Créer la table si elle n'existe pas
        CREATE TABLE public.support_kb_articles (
            id uuid primary key default gen_random_uuid(),
            title text not null,
            content text not null,
            category text default 'general',
            order_index int default 0,
            is_active boolean default true,
            created_at timestamptz default now(),
            updated_at timestamptz default now()
        );
        RAISE NOTICE '✅ Table support_kb_articles créée';
    ELSE
        RAISE NOTICE '✅ Table support_kb_articles existe déjà';
    END IF;
END $$;

-- 1.2 Ajouter les colonnes manquantes si nécessaire
ALTER TABLE public.support_kb_articles 
ADD COLUMN IF NOT EXISTS order_index int default 0,
ADD COLUMN IF NOT EXISTS is_active boolean default true,
ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- =====================================================
-- 2. FONCTIONS ET TRIGGERS
-- =====================================================

-- 2.1 Fonction pour mettre à jour updated_at (CORRIGÉE)
CREATE OR REPLACE FUNCTION public.update_support_kb_articles_updated_at()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- 2.2 Trigger pour updated_at
DROP TRIGGER IF EXISTS update_support_kb_articles_updated_at ON public.support_kb_articles;
CREATE TRIGGER update_support_kb_articles_updated_at
    BEFORE UPDATE ON public.support_kb_articles
    FOR EACH ROW EXECUTE PROCEDURE public.update_support_kb_articles_updated_at();

-- =====================================================
-- 3. POLITIQUES RLS
-- =====================================================

-- 3.1 Activer RLS
ALTER TABLE public.support_kb_articles ENABLE ROW LEVEL SECURITY;

-- 3.2 Supprimer les politiques existantes
DROP POLICY IF EXISTS "KB - gestion admin" ON public.support_kb_articles;
DROP POLICY IF EXISTS "KB - lecture utilisateur" ON public.support_kb_articles;

-- 3.3 Créer les nouvelles politiques
-- Politique pour les admins (gestion complète)
CREATE POLICY "KB - gestion admin" ON public.support_kb_articles
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Politique pour les utilisateurs (lecture uniquement des articles actifs)
CREATE POLICY "KB - lecture utilisateur" ON public.support_kb_articles
    FOR SELECT USING (is_active = true);

-- =====================================================
-- 4. CONFIGURATION REALTIME
-- =====================================================

-- 4.1 Supprimer de la publication si déjà présente
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_kb_articles'
    ) THEN
        ALTER PUBLICATION supabase_realtime DROP TABLE support_kb_articles;
        RAISE NOTICE 'Table support_kb_articles supprimée de la publication';
    END IF;
END $$;

-- 4.2 Ajouter à la publication Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_kb_articles;

-- =====================================================
-- 5. DONNÉES PAR DÉFAUT
-- =====================================================

-- 5.1 Insérer des articles de documentation par défaut
INSERT INTO public.support_kb_articles (title, content, category, order_index, is_active)
SELECT 
    'Guide de démarrage rapide',
    'Bienvenue dans votre espace de coworking ! Voici un guide rapide pour commencer :

1. **Réservation d''espace** : Connectez-vous à votre compte et sélectionnez l''espace souhaité
2. **Paiement** : Choisissez votre créneau et procédez au paiement sécurisé
3. **Accès** : Présentez-vous à l''accueil avec votre confirmation de réservation
4. **Wi-Fi** : Demandez les identifiants de connexion à l''accueil
5. **Services** : Profitez de nos espaces de travail, salles de réunion et zones communes

Pour toute question, n''hésitez pas à contacter notre équipe support !',
    'utilisation',
    1,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.support_kb_articles WHERE title = 'Guide de démarrage rapide');

INSERT INTO public.support_kb_articles (title, content, category, order_index, is_active)
SELECT 
    'Tarifs et abonnements',
    'Découvrez nos différentes formules d''abonnement :

**Pass Journée** : 25€/jour
- Accès à tous les espaces
- Wi-Fi inclus
- Café/thé à volonté
- Support technique

**Pass Semaine** : 120€/semaine
- Tous les avantages du Pass Journée
- Réduction de 15% sur les salles de réunion
- Accès aux événements networking

**Pass Mensuel** : 400€/mois
- Tous les avantages du Pass Semaine
- Accès 24h/24 (avec badge)
- Casier personnel
- Réduction de 25% sur les services additionnels

**Pass Annuel** : 4000€/an
- Tous les avantages du Pass Mensuel
- Réduction de 20% sur l''ensemble
- Accès prioritaire aux nouveaux services

Contactez-nous pour des tarifs personnalisés pour les équipes !',
    'tarifs',
    2,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.support_kb_articles WHERE title = 'Tarifs et abonnements');

INSERT INTO public.support_kb_articles (title, content, category, order_index, is_active)
SELECT 
    'Règles d''utilisation des espaces',
    'Pour garantir un environnement de travail agréable pour tous, merci de respecter ces règles :

**Espaces de travail**
- Parlez à voix basse dans les zones de travail
- Utilisez les salles de réunion pour les discussions en groupe
- Gardez votre espace propre et rangé
- Respectez les créneaux de réservation

**Salles de réunion**
- Réservez à l''avance pour éviter les conflits
- Libérez la salle à la fin de votre créneau
- Remettez la salle en ordre après utilisation
- Signalez tout problème technique

**Zones communes**
- Partagez équitablement les espaces
- Respectez les autres utilisateurs
- Utilisez les casiers pour vos affaires personnelles
- Suivez les consignes de sécurité

**Sécurité**
- Ne laissez jamais vos affaires sans surveillance
- Fermez votre session informatique en partant
- Signalez tout comportement suspect
- Respectez les consignes d''évacuation

Merci de votre collaboration !',
    'general',
    3,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.support_kb_articles WHERE title = 'Règles d''utilisation des espaces');

INSERT INTO public.support_kb_articles (title, content, category, order_index, is_active)
SELECT 
    'Services et équipements disponibles',
    'Découvrez tous les services et équipements mis à votre disposition :

**Équipements de base**
- Wi-Fi fibre haut débit (100 Mbps)
- Prises électriques multiples
- Éclairage LED ajustable
- Climatisation/Chauffage
- Casiers sécurisés

**Salles de réunion**
- Écrans de projection/TV
- Tableaux blancs
- Vidéoprojecteurs
- Systèmes audio
- Capacité : 2 à 20 personnes

**Services additionnels**
- Impression/Numérisation (0,10€/page)
- Service de conciergerie
- Réception de colis
- Service de nettoyage
- Support technique

**Zones de détente**
- Cafétéria avec machine à café
- Espace détente avec canapés
- Terrasse extérieure
- Salle de pause
- Distributeurs de boissons

**Événements et networking**
- Événements mensuels
- Ateliers thématiques
- Sessions de networking
- Conférences
- Formations

Renseignez-vous à l''accueil pour plus de détails !',
    'services',
    4,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.support_kb_articles WHERE title = 'Services et équipements disponibles');

INSERT INTO public.support_kb_articles (title, content, category, order_index, is_active)
SELECT 
    'Résolution des problèmes techniques',
    'Voici les solutions aux problèmes techniques les plus courants :

**Problème de Wi-Fi**
1. Vérifiez que vous êtes connecté au bon réseau
2. Redémarrez votre appareil
3. Contactez l''accueil pour les identifiants
4. Si le problème persiste, contactez le support technique

**Problème électrique**
1. Vérifiez que la prise fonctionne
2. Testez un autre appareil
3. Signalez le problème à l''accueil
4. Nous interviendrons dans les plus brefs délais

**Problème de réservation**
1. Vérifiez votre email de confirmation
2. Contactez le support si vous n''avez pas reçu de confirmation
3. Vérifiez que vous êtes bien connecté à votre compte
4. Essayez de rafraîchir la page

**Problème d''accès**
1. Vérifiez vos horaires de réservation
2. Présentez-vous à l''accueil avec votre confirmation
3. Si vous avez un badge, vérifiez qu''il fonctionne
4. Contactez le support en cas de problème

**Urgences**
- Incendie : Appelez les pompiers (18) et évacuez
- Médical : Appelez le SAMU (15) et contactez l''accueil
- Sécurité : Appelez la police (17) et contactez l''accueil

Notre équipe technique est disponible pour vous aider !',
    'technique',
    5,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.support_kb_articles WHERE title = 'Résolution des problèmes techniques');

-- =====================================================
-- 6. VÉRIFICATIONS FINALES
-- =====================================================

-- 6.1 Vérifier la structure de la table
SELECT 
    'Structure de la table' as verification,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'support_kb_articles'
ORDER BY ordinal_position;

-- 6.2 Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as verification,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'support_kb_articles'
ORDER BY policyname;

-- 6.3 Vérifier la configuration Realtime
SELECT 
    'Configuration Realtime' as verification,
    schemaname,
    tablename,
    pubname,
    CASE 
        WHEN tablename IS NOT NULL THEN '✅ Dans la publication'
        ELSE '❌ Pas dans la publication'
    END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'support_kb_articles';

-- 6.4 Vérifier les données
SELECT 
    'Données' as verification,
    COUNT(*) as total_articles,
    COUNT(CASE WHEN is_active = true THEN 1 END) as articles_actifs,
    COUNT(CASE WHEN is_active = false THEN 1 END) as articles_inactifs,
    COUNT(DISTINCT category) as categories_utilisees
FROM public.support_kb_articles;

-- 6.5 Test d'accès admin
SELECT 
    'Test accès admin' as verification,
    public.is_admin() as is_admin_result,
    CASE 
        WHEN public.is_admin() THEN '✅ Fonction is_admin() fonctionne'
        ELSE '❌ Fonction is_admin() ne fonctionne pas'
    END as admin_status;

-- 6.6 Test d'accès utilisateur
SELECT 
    'Test accès utilisateur' as verification,
    COUNT(*) as articles_accessibles,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Accès utilisateur fonctionne'
        ELSE '❌ Problème d''accès utilisateur'
    END as access_status
FROM public.support_kb_articles 
WHERE is_active = true;

-- 6.7 Vérifier la sécurité de la fonction
SELECT 
    'Sécurité fonction' as verification,
    proname as function_name,
    prosecdef as security_definer,
    CASE 
        WHEN prosecdef = true THEN '✅ SECURITY DEFINER configuré'
        ELSE '❌ SECURITY DEFINER manquant'
    END as security_status,
    CASE 
        WHEN prosrc LIKE '%SET search_path%' THEN '✅ search_path défini'
        ELSE '❌ search_path non défini'
    END as search_path_status
FROM pg_proc 
WHERE proname = 'update_support_kb_articles_updated_at'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

SELECT '🎉 Correction documentation admin terminée avec succès !' as message;
SELECT '📋 Prochaines étapes:' as next_steps;
SELECT '1. Vérifier l''accès à /admin/support' as step1;
SELECT '2. Tester l''onglet "Base de connaissances"' as step2;
SELECT '3. Créer/modifier/supprimer des articles' as step3;
SELECT '4. Vérifier l''affichage côté utilisateur' as step4; 