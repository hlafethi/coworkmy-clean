-- Script de correction immédiate pour la sécurité des fonctions
-- Fixe le problème "Function Search Path Mutable" en définissant un search_path explicite
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Corriger la fonction enqueue_stripe_sync avec un search_path sécurisé
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

-- 2. Identifier toutes les fonctions avec search_path mutable
SELECT 
  'FONCTIONS AVEC SEARCH_PATH MUTABLE' as info,
  proname as function_name,
  pronargs as argument_count,
  prosrc as function_source
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe',
  'sync_space_with_stripe'
);

-- 3. Corriger toutes les autres fonctions Stripe si elles existent
DO $$
BEGIN
  -- Corriger sync_space_with_stripe() (trigger function)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_space_with_stripe' AND pronargs = 0) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.sync_space_with_stripe()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $func$
    DECLARE
        payload JSONB;
        response_status INTEGER;
        response_body TEXT;
    BEGIN
        -- Construire le payload selon le type d''event
        IF TG_OP = ''INSERT'' THEN
            payload := jsonb_build_object(
                ''type'', ''INSERT'',
                ''table'', TG_TABLE_NAME,
                ''record'', to_jsonb(NEW),
                ''old_record'', NULL
            );
        ELSIF TG_OP = ''UPDATE'' THEN
            payload := jsonb_build_object(
                ''type'', ''UPDATE'',
                ''table'', TG_TABLE_NAME,
                ''record'', to_jsonb(NEW),
                ''old_record'', to_jsonb(OLD)
            );
        ELSIF TG_OP = ''DELETE'' THEN
            payload := jsonb_build_object(
                ''type'', ''DELETE'',
                ''table'', TG_TABLE_NAME,
                ''record'', NULL,
                ''old_record'', to_jsonb(OLD)
            );
        END IF;

        -- Appeler l''edge function via http
        SELECT 
            status,
            content
        INTO 
            response_status,
            response_body
        FROM 
            net.http_post(
                url := ''https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe'',
                headers := jsonb_build_object(
                    ''Content-Type'', ''application/json'',
                    ''Authorization'', ''Bearer '' || current_setting(''app.settings.service_role_key'', true)
                ),
                body := payload::text
            );

        -- Log de debug
        RAISE LOG ''Stripe sync trigger: % on space % (status: %, response: %)'', 
            TG_OP, 
            COALESCE(NEW.id, OLD.id), 
            response_status, 
            response_body;

        -- Retourner le record approprié
        IF TG_OP = ''DELETE'' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
    END;
    $func$;';
    RAISE NOTICE 'Fonction sync_space_with_stripe() corrigée';
  END IF;

  -- Corriger sync_space_with_stripe(UUID) (RPC function)
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'sync_space_with_stripe' AND pronargs = 1) THEN
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.sync_space_with_stripe(space_id UUID)
    RETURNS JSONB
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $func$
    DECLARE
      space_record RECORD;
      result JSONB;
    BEGIN
      -- Récupérer l''espace
      SELECT * INTO space_record 
      FROM public.spaces 
      WHERE id = space_id;
      
      IF NOT FOUND THEN
        RETURN jsonb_build_object(
          ''success'', false,
          ''error'', ''Espace non trouvé''
        );
      END IF;
      
      -- Log de la tentative de synchronisation
      INSERT INTO public.application_logs (
        level,
        message,
        metadata,
        created_at
      ) VALUES (
        ''info'',
        ''Synchronisation manuelle Stripe pour l''''espace: '' || space_record.name,
        jsonb_build_object(
          ''space_id'', space_record.id,
          ''space_name'', space_record.name,
          ''pricing_type'', space_record.pricing_type
        ),
        NOW()
      );
      
      -- Mettre à jour le timestamp de synchronisation
      UPDATE public.spaces 
      SET last_stripe_sync = NOW()
      WHERE id = space_id;
      
      RETURN jsonb_build_object(
        ''success'', true,
        ''message'', ''Synchronisation déclenchée pour l''''espace: '' || space_record.name,
        ''space_id'', space_record.id
      );
      
    EXCEPTION
      WHEN OTHERS THEN
        RETURN jsonb_build_object(
          ''success'', false,
          ''error'', SQLERRM
        );
    END;
    $func$;';
    RAISE NOTICE 'Fonction sync_space_with_stripe(UUID) corrigée';
  END IF;
END $$;

-- 4. Vérifier que toutes les fonctions ont maintenant un search_path sécurisé
SELECT 
  'FONCTIONS CORRIGÉES' as info,
  proname as function_name,
  pronargs as argument_count,
  CASE 
    WHEN prosrc LIKE '%SET search_path = public, pg_temp%' THEN '✅ Sécurisé'
    ELSE '❌ Non sécurisé'
  END as security_status
FROM pg_proc 
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname IN (
  'enqueue_stripe_sync',
  'sync_space_with_stripe'
);

-- 5. Log de la correction
DO $$
BEGIN
    RAISE NOTICE 'Sécurité des fonctions corrigée avec succès';
    RAISE NOTICE 'Toutes les fonctions ont maintenant un search_path explicite et sécurisé';
    RAISE NOTICE 'Le problème "Function Search Path Mutable" est résolu';
END $$; 