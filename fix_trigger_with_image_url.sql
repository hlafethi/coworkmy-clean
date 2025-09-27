-- Supprimer l'ancien trigger
DROP TRIGGER IF EXISTS enqueue_stripe_sync ON spaces;

-- Recréer le trigger avec le champ image_url
CREATE OR REPLACE FUNCTION enqueue_stripe_sync()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

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

-- Tester le trigger en déclenchant une mise à jour sur le premier espace actif
UPDATE spaces 
SET last_stripe_sync = last_stripe_sync
WHERE is_active = true 
  AND id = (SELECT id FROM spaces WHERE is_active = true ORDER BY name LIMIT 1);

-- Vérifier que le payload contient maintenant image_url
SELECT 
  space_id,
  payload->>'name' as space_name,
  payload->>'image_url' as image_url,
  created_at
FROM stripe_sync_queue 
ORDER BY created_at DESC
LIMIT 3; 