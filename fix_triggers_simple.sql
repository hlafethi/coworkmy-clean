-- Script simplifié pour corriger les triggers et la sécurité
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer tous les triggers Stripe existants
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
DROP TRIGGER IF EXISTS trg_delete_space_from_stripe ON public.spaces;
DROP TRIGGER IF EXISTS trigger_enqueue_stripe_sync ON public.spaces;

-- 2. Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.enqueue_stripe_sync() CASCADE;
DROP FUNCTION IF EXISTS public.sync_space_with_stripe() CASCADE;

-- 3. Recréer la fonction enqueue_stripe_sync avec sécurité
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

-- 4. Recréer la fonction sync_space_with_stripe avec sécurité
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

-- 5. Créer la fonction update_spaces_updated_at avec sécurité
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

-- 6. Créer le trigger unifié pour Stripe
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync();

-- 7. Créer le trigger pour updated_at s'il n'existe pas
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
    END IF;
END $$;

-- 8. Vérifier les résultats
SELECT 
  'TRIGGERS FINAUX' as info,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'spaces'
AND trigger_schema = 'public'
ORDER BY trigger_name, event_manipulation;

-- 9. Vérifier la sécurité des fonctions
SELECT 
  'FONCTIONS SÉCURISÉES' as info,
  proname as function_name,
  pronargs as argument_count,
  prosecdef as security_definer,
  CASE 
    WHEN prosrc LIKE '%SET search_path = public, pg_temp%' THEN '✅ Sécurisé'
    ELSE '❌ Non sécurisé'
  END as security_status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe',
  'update_spaces_updated_at'
);

-- 10. Test simple de suppression
DO $$
DECLARE
    test_space_id UUID;
BEGIN
    -- Créer un espace de test
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
        'Test Sécurité',
        'Test',
        4,
        'hourly',
        25.00,
        true
    ) RETURNING id INTO test_space_id;
    
    RAISE NOTICE 'Espace test créé: %', test_space_id;
    
    -- Supprimer l'espace de test
    DELETE FROM public.spaces WHERE id = test_space_id;
    
    RAISE NOTICE 'Espace test supprimé avec succès';
    
    -- Nettoyer la queue
    DELETE FROM public.stripe_sync_queue WHERE space_id = test_space_id;
    
    RAISE NOTICE 'Test terminé avec succès';
END $$; 