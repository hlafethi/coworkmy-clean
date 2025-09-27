-- Script pour nettoyer et organiser tous les triggers sur la table spaces
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. DIAGNOSTIC COMPLET DES TRIGGERS
SELECT 
  'DIAGNOSTIC TRIGGERS' as info,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement,
  action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'spaces'
AND trigger_schema = 'public'
ORDER BY trigger_name, event_manipulation;

-- 2. VÉRIFIER LES FONCTIONS UTILISÉES PAR LES TRIGGERS
SELECT 
  'FONCTIONS DES TRIGGERS' as info,
  t.trigger_name,
  t.event_manipulation,
  p.proname as function_name,
  p.prosecdef as security_definer,
  CASE 
    WHEN p.prosrc LIKE '%SET search_path = public, pg_temp%' THEN '✅ Sécurisé'
    ELSE '❌ Non sécurisé'
  END as security_status
FROM information_schema.triggers t
JOIN pg_trigger pg_t ON t.trigger_name = pg_t.tgname
JOIN pg_proc p ON pg_t.tgfoid = p.oid
WHERE t.event_object_table = 'spaces'
AND t.trigger_schema = 'public'
ORDER BY t.trigger_name;

-- 3. NETTOYER TOUS LES TRIGGERS EXISTANTS
DO $$
BEGIN
    RAISE NOTICE 'Nettoyage de tous les triggers existants...';
    
    -- Supprimer tous les triggers Stripe
    DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
    DROP TRIGGER IF EXISTS trg_delete_space_from_stripe ON public.spaces;
    DROP TRIGGER IF EXISTS trigger_enqueue_stripe_sync ON public.spaces;
    
    RAISE NOTICE 'Triggers Stripe supprimés';
END $$;

-- 4. SUPPRIMER ET RECRÉER LES FONCTIONS AVEC LA BONNE SIGNATURE
-- Fonction enqueue_stripe_sync
DROP FUNCTION IF EXISTS public.enqueue_stripe_sync() CASCADE;

CREATE OR REPLACE FUNCTION public.enqueue_stripe_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Liste des champs métier qui doivent déclencher la synchronisation
    IF OLD.name IS DISTINCT FROM NEW.name OR
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.pricing_type IS DISTINCT FROM NEW.pricing_type OR
       OLD.hourly_price IS DISTINCT FROM NEW.hourly_price OR
       OLD.daily_price IS DISTINCT FROM NEW.daily_price OR
       OLD.half_day_price IS DISTINCT FROM NEW.half_day_price OR
       OLD.monthly_price IS DISTINCT FROM NEW.monthly_price OR
       OLD.quarter_price IS DISTINCT FROM NEW.quarter_price OR
       OLD.yearly_price IS DISTINCT FROM NEW.yearly_price OR
       OLD.custom_price IS DISTINCT FROM NEW.custom_price OR
       OLD.image_url IS DISTINCT FROM NEW.image_url OR
       OLD.status IS DISTINCT FROM NEW.status THEN
      
      -- Au moins un champ métier a changé, on peut synchroniser
      INSERT INTO public.stripe_sync_queue (space_id, event_type, payload)
      VALUES (NEW.id, TG_OP, to_jsonb(NEW));
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    -- Pour INSERT, on synchronise toujours
    INSERT INTO public.stripe_sync_queue (space_id, event_type, payload)
    VALUES (NEW.id, TG_OP, to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    -- Pour DELETE, on synchronise toujours avec l'ID de l'ancien enregistrement
    INSERT INTO public.stripe_sync_queue (space_id, event_type, payload)
    VALUES (OLD.id, TG_OP, to_jsonb(OLD));
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Fonction sync_space_with_stripe
DROP FUNCTION IF EXISTS public.sync_space_with_stripe() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_space_with_stripe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    payload JSONB;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Construire le payload selon le type d'event
    IF TG_OP = 'INSERT' THEN
        payload := jsonb_build_object(
            'type', 'INSERT',
            'table', TG_TABLE_NAME,
            'record', to_jsonb(NEW),
            'old_record', NULL
        );
    ELSIF TG_OP = 'UPDATE' THEN
        payload := jsonb_build_object(
            'type', 'UPDATE',
            'table', TG_TABLE_NAME,
            'record', to_jsonb(NEW),
            'old_record', to_jsonb(OLD)
        );
    ELSIF TG_OP = 'DELETE' THEN
        payload := jsonb_build_object(
            'type', 'DELETE',
            'table', TG_TABLE_NAME,
            'record', NULL,
            'old_record', to_jsonb(OLD)
        );
    END IF;

    -- Appeler l'edge function via http
    SELECT 
        status,
        content
    INTO 
        response_status,
        response_body
    FROM 
        net.http_post(
            url := 'https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := payload::text
        );

    -- Log de debug
    RAISE LOG 'Stripe sync trigger: % on space % (status: %, response: %)', 
        TG_OP, 
        COALESCE(NEW.id, OLD.id), 
        response_status, 
        response_body;

    -- Retourner le record approprié
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- 5. CRÉER UN SEUL TRIGGER UNIFIÉ POUR TOUS LES ÉVÉNEMENTS
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync();

-- 6. VÉRIFIER QUE LE TRIGGER UPDATE_SPACES_UPDATED_AT EXISTE ET EST CORRECT
-- Créer la fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_spaces_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Créer le trigger s'il n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_spaces_updated_at'
        AND event_object_table = 'spaces'
    ) THEN
        CREATE TRIGGER trigger_update_spaces_updated_at
          BEFORE UPDATE ON public.spaces
          FOR EACH ROW
          EXECUTE FUNCTION public.update_spaces_updated_at();
          
        RAISE NOTICE 'Trigger trigger_update_spaces_updated_at créé';
    ELSE
        RAISE NOTICE 'Trigger trigger_update_spaces_updated_at existe déjà';
    END IF;
END $$;

-- 7. VÉRIFIER LES CORRECTIONS
SELECT 
  'TRIGGERS FINAUX' as info,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'spaces'
AND trigger_schema = 'public'
ORDER BY trigger_name, event_manipulation;

-- 8. VÉRIFIER LA SÉCURITÉ DES FONCTIONS
SELECT 
  'FONCTIONS SÉCURISÉES' as info,
  proname as function_name,
  pronargs as argument_count,
  prosecdef as security_definer,
  CASE 
    WHEN prosrc LIKE '%SET search_path = public, pg_temp%' THEN '✅ Sécurisé'
    ELSE '❌ Non sécurisé'
  END as security_status,
  LEFT(prosrc, 100) as function_preview
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe',
  'update_spaces_updated_at'
);

-- 9. TESTER LA SUPPRESSION D'ESPACE
-- Créer un espace de test pour vérifier que la suppression fonctionne
DO $$
DECLARE
    test_space_id UUID;
BEGIN
    -- Insérer un espace de test
    INSERT INTO public.spaces (
        id,
        name,
        description,
        capacity,
        pricing_type,
        hourly_price,
        is_active
    ) VALUES (
        gen_random_uuid(),
        'Espace Test Sécurité',
        'Espace de test pour vérifier la suppression',
        4,
        'hourly',
        25.00,
        true
    ) RETURNING id INTO test_space_id;
    
    RAISE NOTICE 'Espace de test créé avec ID: %', test_space_id;
    
    -- Attendre un peu pour que le trigger s'exécute
    PERFORM pg_sleep(1);
    
    -- Vérifier que l'espace a été ajouté à la queue
    IF EXISTS (
        SELECT 1 FROM public.stripe_sync_queue 
        WHERE space_id = test_space_id
    ) THEN
        RAISE NOTICE '✅ Trigger fonctionne: espace ajouté à la queue';
    ELSE
        RAISE NOTICE '❌ Problème: espace non ajouté à la queue';
    END IF;
    
    -- Supprimer l'espace de test
    DELETE FROM public.spaces WHERE id = test_space_id;
    
    RAISE NOTICE 'Espace de test supprimé';
    
    -- Nettoyer la queue
    DELETE FROM public.stripe_sync_queue WHERE space_id = test_space_id;
    
    RAISE NOTICE 'Queue nettoyée';
END $$;

-- 10. Log final
DO $$
BEGIN
    RAISE NOTICE 'Nettoyage et organisation des triggers terminés';
    RAISE NOTICE 'Tous les triggers sont maintenant organisés et sécurisés';
    RAISE NOTICE 'Test de suppression d''espace effectué';
END $$; 