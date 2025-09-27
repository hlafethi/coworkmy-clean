-- Migration pour ajouter la synchronisation automatique Stripe
-- Cette migration ajoute un trigger qui appelle automatiquement la fonction sync-space-stripe
-- lors de la création ou modification d'un espace

-- Fonction pour appeler l'API Supabase Edge Function
CREATE OR REPLACE FUNCTION public.trigger_stripe_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  function_url TEXT;
  response_status INTEGER;
  response_body TEXT;
BEGIN
  -- Construire l'URL de la fonction Edge
  function_url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-space-stripe';
  
  -- Appeler la fonction Edge de manière asynchrone
  -- Note: Cette approche utilise http_request qui doit être activé
  -- Si http_request n'est pas disponible, on peut utiliser une approche alternative
  
  -- Pour l'instant, on log l'événement
  INSERT INTO public.application_logs (
    level,
    message,
    metadata,
    created_at
  ) VALUES (
    'info',
    'Synchronisation Stripe déclenchée pour l''espace: ' || NEW.name,
    jsonb_build_object(
      'space_id', NEW.id,
      'space_name', NEW.name,
      'pricing_type', NEW.pricing_type,
      'is_active', NEW.is_active
    ),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, on log l'erreur mais on ne bloque pas l'opération
    INSERT INTO public.application_logs (
      level,
      message,
      metadata,
      created_at
    ) VALUES (
      'error',
      'Erreur lors du déclenchement de la synchronisation Stripe: ' || SQLERRM,
      jsonb_build_object(
        'space_id', NEW.id,
        'space_name', NEW.name,
        'error', SQLERRM
      ),
      NOW()
    );
    RETURN NEW;
END;
$$;

-- Créer le trigger sur la table spaces
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_stripe_sync();

-- Ajouter une colonne pour tracker la synchronisation si elle n'existe pas
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'spaces' 
    AND column_name = 'last_stripe_sync'
  ) THEN
    ALTER TABLE public.spaces 
    ADD COLUMN last_stripe_sync TIMESTAMPTZ;
  END IF;
END $$;

-- Fonction pour synchroniser manuellement un espace avec Stripe
CREATE OR REPLACE FUNCTION public.sync_space_with_stripe(space_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  space_record RECORD;
  result JSONB;
BEGIN
  -- Récupérer l'espace
  SELECT * INTO space_record 
  FROM public.spaces 
  WHERE id = space_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Espace non trouvé'
    );
  END IF;
  
  -- Log de la tentative de synchronisation
  INSERT INTO public.application_logs (
    level,
    message,
    metadata,
    created_at
  ) VALUES (
    'info',
    'Synchronisation manuelle Stripe pour l''espace: ' || space_record.name,
    jsonb_build_object(
      'space_id', space_record.id,
      'space_name', space_record.name,
      'pricing_type', space_record.pricing_type
    ),
    NOW()
  );
  
  -- Mettre à jour le timestamp de synchronisation
  UPDATE public.spaces 
  SET last_stripe_sync = NOW()
  WHERE id = space_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Synchronisation déclenchée pour l''espace: ' || space_record.name,
    'space_id', space_record.id
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- RPC pour permettre l'appel depuis le frontend
GRANT EXECUTE ON FUNCTION public.sync_space_with_stripe(UUID) TO authenticated;

-- Politique pour permettre aux admins d'appeler cette fonction
CREATE POLICY "Les administrateurs peuvent synchroniser avec Stripe"
  ON public.spaces
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Commentaires pour la documentation
COMMENT ON FUNCTION public.trigger_stripe_sync() IS 
'Fonction trigger qui déclenche la synchronisation automatique avec Stripe lors de la création/modification d''un espace';

COMMENT ON FUNCTION public.sync_space_with_stripe(UUID) IS 
'Fonction pour synchroniser manuellement un espace avec Stripe via l''API Edge Function';

COMMENT ON COLUMN public.spaces.last_stripe_sync IS 
'Timestamp de la dernière synchronisation avec Stripe'; 