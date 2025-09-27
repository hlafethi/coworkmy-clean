-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS enqueue_stripe_sync ON spaces;

-- Recréer la fonction avec search_path explicite pour la sécurité
CREATE OR REPLACE FUNCTION enqueue_stripe_sync()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO stripe_sync_queue (space_id, event_type, payload)
  VALUES (
    NEW.id, 
    TG_OP, 
    jsonb_build_object(
      'id', NEW.id,
      'name', NEW.name,
      'description', NULLIF(NEW.description, ''),
      'pricing_type', NEW.pricing_type,
      'hourly_price', NEW.hourly_price,
      'daily_price', NEW.daily_price,
      'half_day_price', NEW.half_day_price,
      'monthly_price', NEW.monthly_price,
      'quarter_price', NEW.quarter_price,
      'yearly_price', NEW.yearly_price,
      'custom_price', NEW.custom_price,
      'stripe_product_id', NEW.stripe_product_id,
      'stripe_price_id', NEW.stripe_price_id,
      'image_url', NEW.image_url
    )
  );
  RETURN NEW;
END;
$$;

-- Recréer le trigger
CREATE TRIGGER enqueue_stripe_sync
  AFTER INSERT OR UPDATE ON spaces
  FOR EACH ROW
  EXECUTE FUNCTION enqueue_stripe_sync();

-- Vérifier que le trigger fonctionne
SELECT 
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'enqueue_stripe_sync';

-- Vérifier la sécurité de la fonction
SELECT 
  proname,
  prosecdef,
  proconfig
FROM pg_proc 
WHERE proname = 'enqueue_stripe_sync'; 