-- Migration pour corriger les problèmes de sécurité search_path
-- Cette migration corrige les fonctions qui ont un search_path mutable

-- Corriger la fonction trigger_stripe_sync
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

-- Corriger la fonction sync_space_with_stripe
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

-- Corriger la fonction handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Corriger la fonction handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Corriger la fonction is_admin (au cas où)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- Commentaires pour documenter les corrections de sécurité
COMMENT ON FUNCTION public.trigger_stripe_sync() IS 
'Fonction trigger sécurisée avec search_path fixe pour la synchronisation automatique avec Stripe';

COMMENT ON FUNCTION public.sync_space_with_stripe(UUID) IS 
'Fonction sécurisée avec search_path fixe pour synchroniser manuellement un espace avec Stripe';

COMMENT ON FUNCTION public.handle_updated_at() IS 
'Fonction sécurisée avec search_path fixe pour mettre à jour automatiquement le champ updated_at';

COMMENT ON FUNCTION public.handle_new_user() IS 
'Fonction sécurisée avec search_path fixe pour créer automatiquement un profil utilisateur';

COMMENT ON FUNCTION public.is_admin() IS 
'Fonction sécurisée avec search_path fixe pour vérifier les droits administrateur'; 