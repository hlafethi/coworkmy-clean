-- Migration pour ajouter les politiques RLS manquantes pour stripe_sync_queue
-- Date: 2025-07-07

-- 1. Vérifier que la table existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'stripe_sync_queue'
    ) THEN
        RAISE EXCEPTION 'La table stripe_sync_queue n''existe pas';
    END IF;
END $$;

-- 2. Activer RLS sur la table si ce n'est pas déjà fait
ALTER TABLE public.stripe_sync_queue ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les politiques existantes pour éviter les doublons
DROP POLICY IF EXISTS "Les administrateurs peuvent gérer la file d'attente Stripe" ON public.stripe_sync_queue;
DROP POLICY IF EXISTS "Le service role peut gérer la file d'attente Stripe" ON public.stripe_sync_queue;

-- 4. Créer la politique pour les administrateurs
CREATE POLICY "Les administrateurs peuvent gérer la file d'attente Stripe"
    ON public.stripe_sync_queue
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Créer la politique pour le service role (nécessaire pour les fonctions Edge)
CREATE POLICY "Le service role peut gérer la file d'attente Stripe"
    ON public.stripe_sync_queue
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. Vérifier que les politiques ont été créées
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stripe_sync_queue'
        AND schemaname = 'public'
        AND policyname = 'Les administrateurs peuvent gérer la file d''attente Stripe'
    ) THEN
        RAISE EXCEPTION 'La politique pour les administrateurs n''a pas été créée';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stripe_sync_queue'
        AND schemaname = 'public'
        AND policyname = 'Le service role peut gérer la file d''attente Stripe'
    ) THEN
        RAISE EXCEPTION 'La politique pour le service role n''a pas été créée';
    END IF;
    
    RAISE NOTICE 'Politiques RLS créées avec succès pour stripe_sync_queue';
END $$; 