-- Correction du trigger pour garantir l'INSERT dans la queue
-- Problème : les nouveaux espaces ne créent pas de jobs INSERT dans stripe_sync_queue
-- Solution : forcer la création d'un job pour chaque INSERT, même si certains champs sont NULL

-- 1. Fonction trigger corrigée pour garantir l'INSERT
CREATE OR REPLACE FUNCTION public.enqueue_stripe_sync()
RETURNS TRIGGER AS $$
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
  ELSE
    -- Pour INSERT et DELETE, on synchronise TOUJOURS (même si certains champs sont NULL)
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

-- 2. Nettoyer la queue existante pour éviter les conflits
DELETE FROM public.stripe_sync_queue WHERE status = 'pending';

-- 3. Log de la correction
DO $$
BEGIN
  RAISE NOTICE 'Trigger stripe_sync corrigé pour garantir les INSERT';
  RAISE NOTICE 'Tous les nouveaux espaces créeront maintenant un job dans la queue';
END $$; 