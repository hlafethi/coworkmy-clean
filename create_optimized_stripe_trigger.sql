-- Trigger optimisé pour la synchronisation Stripe
-- Construction explicite du JSONB pour éviter les problèmes de type
-- Conversion des chaînes vides en NULL pour éviter les erreurs Stripe

CREATE OR REPLACE FUNCTION public.enqueue_stripe_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO stripe_sync_queue (space_id, event_type, payload)
  VALUES (
    NEW.id, 
    TG_OP, 
    jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'description', NULLIF(NEW.description, ''), -- Convertit les chaînes vides en NULL
      'pricing_type', NEW.pricing_type,
      'hourly_price', NEW.hourly_price,
      'daily_price', NEW.daily_price,
      'half_day_price', NEW.half_day_price,
      'monthly_price', NEW.monthly_price,
      'quarter_price', NEW.quarter_price,
      'yearly_price', NEW.yearly_price,
      'custom_price', NEW.custom_price,
      'stripe_product_id', NEW.stripe_product_id,
      'stripe_price_id', NEW.stripe_price_id
    ) -- Construction explicite du JSON
  );
  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_enqueue_stripe_sync ON spaces;

-- Créer le nouveau trigger
CREATE TRIGGER trigger_enqueue_stripe_sync
  AFTER INSERT OR UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync();

-- Vérifier que le trigger est bien créé
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_enqueue_stripe_sync'; 