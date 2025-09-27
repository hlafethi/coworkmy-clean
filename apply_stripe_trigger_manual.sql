-- Script pour appliquer manuellement le trigger de synchronisation Stripe
-- Ce script doit être exécuté directement dans la base de données

-- 1. Créer la fonction qui appelle l'edge function
CREATE OR REPLACE FUNCTION sync_space_with_stripe()
RETURNS TRIGGER AS $$
DECLARE
    payload JSONB;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Construire le payload selon le type d'event
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

    -- Appeler l'edge function via http
    SELECT 
        status,
        content
    INTO 
        response_status,
        response_body
    FROM 
        net.http_post(
            url := 'https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            body := payload::text
        );

    -- Log de debug
    RAISE LOG 'Stripe sync trigger: % on space % (status: %, response: %)', 
        TG_OP, 
        COALESCE(NEW.id, OLD.id), 
        response_status, 
        response_body;

    -- Retourner le record approprié
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;

EXCEPTION WHEN OTHERS THEN
    -- Log de l'erreur mais ne pas faire échouer l'opération
    RAISE LOG 'Erreur dans sync_space_with_stripe: %', SQLERRM;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Créer le trigger
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON spaces;

CREATE TRIGGER trigger_stripe_sync_on_spaces
    AFTER INSERT OR UPDATE OR DELETE ON spaces
    FOR EACH ROW
    EXECUTE FUNCTION sync_space_with_stripe();

-- 3. Vérifier que le trigger est créé
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_stripe_sync_on_spaces';

-- 4. Test du trigger (optionnel)
-- INSERT INTO spaces (name, description, capacity, price_per_hour, is_active) 
-- VALUES ('Test Space Manual', 'Espace de test manuel', 10, 25.00, true); 