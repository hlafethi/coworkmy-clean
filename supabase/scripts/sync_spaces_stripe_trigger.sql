-- Script SQL : Trigger pour synchronisation Stripe automatique des espaces
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Créer la fonction Postgres qui appelle l'edge function
CREATE OR REPLACE FUNCTION public.sync_space_stripe()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  payload jsonb;
  event_type text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    payload := jsonb_build_object(
      'type', 'INSERT',
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW)
    );
    event_type := 'INSERT';
  ELSIF (TG_OP = 'UPDATE') THEN
    payload := jsonb_build_object(
      'type', 'UPDATE',
      'table', TG_TABLE_NAME,
      'record', row_to_json(NEW),
      'old_record', row_to_json(OLD)
    );
    event_type := 'UPDATE';
  ELSIF (TG_OP = 'DELETE') THEN
    payload := jsonb_build_object(
      'type', 'DELETE',
      'table', TG_TABLE_NAME,
      'old_record', row_to_json(OLD)
    );
    event_type := 'DELETE';
  END IF;

  -- Appel de l'edge function via http (rpc)
  PERFORM
    net.http_post(
      'https://<YOUR_PROJECT_ID>.functions.supabase.co/sync-space-stripe',
      payload::text,
      'application/json',
      ARRAY[ROW('Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key'))::http_header]
    );

  RETURN NULL;
END;
$$;

-- 2. Créer le trigger sur la table spaces
DROP TRIGGER IF EXISTS trigger_sync_space_stripe ON public.spaces;
CREATE TRIGGER trigger_sync_space_stripe
AFTER INSERT OR UPDATE OR DELETE ON public.spaces
FOR EACH ROW EXECUTE FUNCTION public.sync_space_stripe();

-- Remplace <YOUR_PROJECT_ID> par ton vrai project id Supabase !
-- Ajoute la variable app.supabase_service_role_key dans les settings Postgres si besoin. 