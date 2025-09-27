-- 1. Table de file d'attente pour la synchronisation Stripe
CREATE TABLE IF NOT EXISTS public.stripe_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id uuid NOT NULL,
  event_type text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  payload jsonb NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'processing', 'done', 'error'
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- 2. Fonction trigger pour insérer dans la queue (évite la boucle)
CREATE OR REPLACE FUNCTION public.enqueue_stripe_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Ne pas déclencher si seuls les champs Stripe ont changé (évite la boucle)
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
  ELSE
    -- Pour INSERT et DELETE, on synchronise toujours
    INSERT INTO public.stripe_sync_queue (space_id, event_type, payload)
    VALUES (
      COALESCE(NEW.id, OLD.id),
      TG_OP,
      CASE
        WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD)
        ELSE to_jsonb(NEW)
      END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger sur la table spaces
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON public.spaces;
CREATE TRIGGER trigger_stripe_sync_on_spaces
  AFTER INSERT OR UPDATE OR DELETE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_stripe_sync(); 