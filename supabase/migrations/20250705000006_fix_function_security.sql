-- Migration pour corriger la sécurité de la fonction trigger
-- Ajout d'un search_path explicite pour éviter les problèmes de sécurité

-- Recréer la fonction avec un search_path sécurisé
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

    -- Appeler l'edge function via http avec la bonne signature
    SELECT 
        status,
        content
    INTO 
        response_status,
        response_body
    FROM 
        net.http_post(
            'https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe',
            jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
            ),
            payload
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Recréer le trigger
DROP TRIGGER IF EXISTS trigger_stripe_sync_on_spaces ON spaces;

CREATE TRIGGER trigger_stripe_sync_on_spaces
    AFTER INSERT OR UPDATE OR DELETE ON spaces
    FOR EACH ROW
    EXECUTE FUNCTION sync_space_with_stripe();

-- Vérifier que le trigger est créé
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_stripe_sync_on_spaces';

-- Vérifier la sécurité de la fonction
SELECT 
    proname,
    prosecdef,
    proconfig
FROM pg_proc 
WHERE proname = 'sync_space_with_stripe'; 