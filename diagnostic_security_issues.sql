-- Script de diagnostic pour identifier les problèmes de sécurité
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. DIAGNOSTIC DÉTAILLÉ DES FONCTIONS
SELECT 
  'DIAGNOSTIC FONCTIONS' as info,
  proname as function_name,
  pronargs as argument_count,
  prokind as function_kind,
  prosecdef as security_definer,
  prosrc as function_source,
  CASE 
    WHEN prosrc LIKE '%SET search_path = public, pg_temp%' THEN '✅ Sécurisé'
    WHEN prosrc LIKE '%search_path%' THEN '⚠️ Search_path défini mais incorrect'
    ELSE '❌ Pas de search_path'
  END as security_status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe'
);

-- 2. VÉRIFIER LES TRIGGERS ASSOCIÉS
SELECT 
  'TRIGGERS' as info,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'spaces'
AND trigger_schema = 'public';

-- 3. VÉRIFIER LES EXTENSIONS
SELECT 
  'EXTENSIONS' as info,
  extname as extension_name,
  nspname as schema_name,
  extversion as version,
  CASE 
    WHEN nspname = 'public' THEN '❌ Dans public'
    ELSE '✅ Dans schéma dédié'
  END as security_status
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid
WHERE extname = 'pg_net';

-- 4. TENTER UNE CORRECTION FORCÉE
-- Supprimer complètement les fonctions et les recréer
DO $$
BEGIN
    RAISE NOTICE 'Tentative de correction forcée des fonctions...';
    
    -- Supprimer les triggers d'abord
    DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
    DROP TRIGGER IF EXISTS trigger_enqueue_stripe_sync ON public.spaces;
    
    -- Supprimer les fonctions
    DROP FUNCTION IF EXISTS public.enqueue_stripe_sync() CASCADE;
    DROP FUNCTION IF EXISTS public.sync_space_with_stripe() CASCADE;
    
    RAISE NOTICE 'Fonctions supprimées avec succès';
END $$;

-- 5. RECRÉER LA FONCTION enqueue_stripe_sync
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

-- 6. RECRÉER LA FONCTION sync_space_with_stripe
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

-- 7. RECRÉER LE TRIGGER
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync();

-- 8. VÉRIFIER LES CORRECTIONS
SELECT 
  'FONCTIONS APRÈS CORRECTION' as info,
  proname as function_name,
  pronargs as argument_count,
  prosecdef as security_definer,
  CASE 
    WHEN prosrc LIKE '%SET search_path = public, pg_temp%' THEN '✅ Sécurisé'
    ELSE '❌ Non sécurisé'
  END as security_status,
  LEFT(prosrc, 200) as function_preview
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe'
);

-- 9. VÉRIFIER LES TRIGGERS APRÈS CORRECTION
SELECT 
  'TRIGGERS APRÈS CORRECTION' as info,
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'spaces'
AND trigger_schema = 'public';

-- 10. Log final
DO $$
BEGIN
    RAISE NOTICE 'Diagnostic et correction terminés';
    RAISE NOTICE 'Vérifiez les résultats ci-dessus pour confirmer la sécurité';
END $$; 