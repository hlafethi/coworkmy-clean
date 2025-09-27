-- Migration complète pour corriger tous les problèmes de sécurité
-- Fixe les problèmes "Function Search Path Mutable" et "Extension in Public"

-- 1. Supprimer et recréer la fonction enqueue_stripe_sync avec la bonne signature
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

-- 2. Recréer le trigger
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync();

-- 3. Supprimer et recréer la fonction sync_space_with_stripe (trigger function)
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

-- 4. Créer un schéma dédié pour les extensions
CREATE SCHEMA IF NOT EXISTS extensions;

-- 5. Tenter de déplacer l'extension pg_net
-- Note: Cette opération peut nécessiter des privilèges superuser
DO $$
BEGIN
    -- Vérifier si l'extension est dans le schéma public
    IF EXISTS (
        SELECT 1 FROM pg_extension 
        WHERE extname = 'pg_net' 
        AND extnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    ) THEN
        -- Tenter de déplacer l'extension
        BEGIN
            ALTER EXTENSION pg_net SET SCHEMA extensions;
            RAISE NOTICE 'Extension pg_net déplacée vers le schéma extensions';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Impossible de déplacer pg_net: %. Contactez l''administrateur Supabase.', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Extension pg_net n''est pas dans le schéma public';
    END IF;
END $$;

-- 6. Vérifier que toutes les fonctions ont un search_path sécurisé
DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
    secure_count INTEGER := 0;
BEGIN
    FOR func_record IN 
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname IN ('enqueue_stripe_sync', 'sync_space_with_stripe')
    LOOP
        func_count := func_count + 1;
        IF func_record.prosrc LIKE '%SET search_path = public, pg_temp%' THEN
            secure_count := secure_count + 1;
            RAISE NOTICE 'Fonction % est sécurisée', func_record.proname;
        ELSE
            RAISE NOTICE 'Fonction % n''est PAS sécurisée', func_record.proname;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Résumé: % fonctions vérifiées, % sécurisées', func_count, secure_count;
END $$; 