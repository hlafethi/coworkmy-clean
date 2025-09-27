-- Script final pour corriger définitivement la sécurité des fonctions
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. DIAGNOSTIC DÉTAILLÉ DES FONCTIONS
SELECT 
  'DIAGNOSTIC DÉTAILLÉ' as info,
  proname as function_name,
  pronargs as argument_count,
  prosecdef as security_definer,
  proconfig as function_config,
  LEFT(prosrc, 200) as function_preview
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe',
  'update_spaces_updated_at'
);

-- 2. SUPPRIMER COMPLÈTEMENT ET RECRÉER LES FONCTIONS
-- Supprimer d'abord tous les triggers
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
DROP TRIGGER IF EXISTS trigger_update_spaces_updated_at ON public.spaces;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS public.enqueue_stripe_sync() CASCADE;
DROP FUNCTION IF EXISTS public.sync_space_with_stripe() CASCADE;
DROP FUNCTION IF EXISTS public.update_spaces_updated_at() CASCADE;

-- 3. RECRÉER LA FONCTION enqueue_stripe_sync AVEC LA BONNE SIGNATURE
CREATE FUNCTION public.enqueue_stripe_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
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
$function$;

-- 4. RECRÉER LA FONCTION sync_space_with_stripe AVEC LA BONNE SIGNATURE
CREATE FUNCTION public.sync_space_with_stripe()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
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
$function$;

-- 5. RECRÉER LA FONCTION update_spaces_updated_at AVEC LA BONNE SIGNATURE
CREATE FUNCTION public.update_spaces_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

-- 6. CRÉER LES TRIGGERS
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync();

CREATE TRIGGER trigger_update_spaces_updated_at
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_spaces_updated_at();

-- 7. VÉRIFIER LA SÉCURITÉ AVEC UNE REQUÊTE PLUS PRÉCISE
SELECT 
  'FONCTIONS APRÈS CORRECTION' as info,
  proname as function_name,
  pronargs as argument_count,
  prosecdef as security_definer,
  proconfig as function_config,
  CASE 
    WHEN proconfig @> ARRAY['search_path=public, pg_temp'] THEN '✅ Sécurisé'
    WHEN proconfig @> ARRAY['search_path=public,pg_temp'] THEN '✅ Sécurisé'
    WHEN proconfig @> ARRAY['search_path=public, pg_temp, pg_catalog'] THEN '✅ Sécurisé'
    WHEN proconfig @> ARRAY['search_path=public,pg_temp,pg_catalog'] THEN '✅ Sécurisé'
    ELSE '❌ Non sécurisé'
  END as security_status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe',
  'update_spaces_updated_at'
);

-- 8. VÉRIFIER LES TRIGGERS
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

-- 9. TEST DE SUPPRESSION
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
        'Test Final',
        'Test final de sécurité',
        4,
        'hourly',
        25.00,
        true
    ) RETURNING id INTO test_space_id;
    
    RAISE NOTICE 'Espace test créé: %', test_space_id;
    
    -- Attendre un peu
    PERFORM pg_sleep(0.5);
    
    -- Vérifier la queue
    IF EXISTS (
        SELECT 1 FROM public.stripe_sync_queue 
        WHERE space_id = test_space_id
    ) THEN
        RAISE NOTICE '✅ Queue Stripe fonctionne';
    ELSE
        RAISE NOTICE '❌ Problème avec la queue Stripe';
    END IF;
    
    -- Supprimer l'espace de test
    DELETE FROM public.spaces WHERE id = test_space_id;
    
    RAISE NOTICE '✅ Suppression réussie';
    
    -- Nettoyer
    DELETE FROM public.stripe_sync_queue WHERE space_id = test_space_id;
    
    RAISE NOTICE 'Test final terminé avec succès';
END $$;

-- 10. Log final
DO $$
BEGIN
    RAISE NOTICE 'Correction de sécurité terminée';
    RAISE NOTICE 'Toutes les fonctions ont été recréées avec SET search_path';
    RAISE NOTICE 'Vérifiez les résultats ci-dessus';
END $$; 