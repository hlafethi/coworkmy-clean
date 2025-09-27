-- 1. Supprimer tous les triggers Stripe existants pour éviter les conflits
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
DROP TRIGGER IF EXISTS trg_delete_space_from_stripe ON public.spaces;
DROP TRIGGER IF EXISTS trigger_enqueue_stripe_sync ON public.spaces;

-- 2. Supprimer et recréer les fonctions avec la signature correcte
DROP FUNCTION IF EXISTS public.enqueue_stripe_sync() CASCADE;
DROP FUNCTION IF EXISTS public.sync_space_with_stripe() CASCADE;
DROP FUNCTION IF EXISTS public.update_spaces_updated_at() CASCADE;

-- 3. Recréer la fonction enqueue_stripe_sync avec sécurité et gestion des doublons
CREATE OR REPLACE FUNCTION public.enqueue_stripe_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
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
       OLD.is_active IS DISTINCT FROM NEW.is_active
    THEN
      INSERT INTO public.stripe_sync_queue (space_id, event_type, payload)
      VALUES (NEW.id, TG_OP, to_jsonb(NEW))
      ON CONFLICT (space_id, event_type)
      DO UPDATE SET payload = EXCLUDED.payload;
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.stripe_sync_queue (space_id, event_type, payload)
    VALUES (NEW.id, TG_OP, to_jsonb(NEW))
    ON CONFLICT (space_id, event_type)
    DO UPDATE SET payload = EXCLUDED.payload;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.stripe_sync_queue (space_id, event_type, payload)
    VALUES (OLD.id, TG_OP, to_jsonb(OLD))
    ON CONFLICT (space_id, event_type)
    DO UPDATE SET payload = EXCLUDED.payload;
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

    SELECT status, content
    INTO response_status, response_body
    FROM net.http_post(
        url := 'https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        body := payload::text
    );

    RAISE LOG 'Stripe sync trigger: % on space % (status: %, response: %)',
        TG_OP,
        COALESCE(NEW.id, OLD.id),
        response_status,
        response_body;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- 5. Créer la fonction update_spaces_updated_at (toujours à l'extérieur d'un bloc DO)
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

-- 6. Créer le trigger principal Stripe
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync();

-- 7. Créer le trigger updated_at si il n'existe pas déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_spaces_updated_at'
        AND event_object_table = 'spaces'
    ) THEN
        EXECUTE $t$
        CREATE TRIGGER trigger_update_spaces_updated_at
          BEFORE UPDATE ON public.spaces
          FOR EACH ROW
          EXECUTE FUNCTION public.update_spaces_updated_at();
        $t$;
    END IF;
END $$;

-- 8. Vérifier que toutes les fonctions sont sécurisées
DO $$
DECLARE
    func_record RECORD;
    secure_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    FOR func_record IN 
        SELECT proname, prosrc 
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
        AND proname IN ('enqueue_stripe_sync', 'sync_space_with_stripe', 'update_spaces_updated_at')
    LOOP
        total_count := total_count + 1;
        IF func_record.prosrc LIKE '%SET search_path = public, pg_temp%' THEN
            secure_count := secure_count + 1;
            RAISE NOTICE '✅ Fonction % est sécurisée', func_record.proname;
        ELSE
            RAISE NOTICE '❌ Fonction % n''est PAS sécurisée', func_record.proname;
        END IF;
    END LOOP;

    RAISE NOTICE 'Résumé sécurité: %/% fonctions sécurisées', secure_count, total_count;
END $$;

-- 9. Vérifier l'organisation finale des triggers
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'spaces'
    AND trigger_schema = 'public';

    RAISE NOTICE 'Organisation terminée: % triggers sur la table spaces', trigger_count;
END $$;
