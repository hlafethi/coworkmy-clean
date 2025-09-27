-- Correction du trigger enqueue_stripe_sync pour Stripe
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
      'description', NULLIF(NEW.description, ''),
      'pricing_type', NEW.pricing_type,
      'hourly_price', COALESCE(NEW.hourly_price, 0),
      'daily_price', COALESCE(NEW.daily_price, 0),
      'half_day_price', COALESCE(NEW.half_day_price, 0),
      'monthly_price', COALESCE(NEW.monthly_price, 0),
      'quarter_price', COALESCE(NEW.quarter_price, 0),
      'yearly_price', COALESCE(NEW.yearly_price, 0),
      'custom_price', COALESCE(NEW.custom_price, 0),
      'stripe_product_id', NEW.stripe_product_id,
      'stripe_price_id', NEW.stripe_price_id
    )
  );
  RETURN NEW;
END;
$$; 