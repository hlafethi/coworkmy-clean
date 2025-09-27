-- Migration pour corriger la signature de la fonction sync_space_with_stripe
-- et ajouter une fonction RPC pour l'appel manuel depuis le frontend

-- 1. Vérifier l'état actuel
SELECT 'ETAT ACTUEL' as info;
SELECT 
    proname,
    proargtypes,
    proargnames
FROM pg_proc 
WHERE proname = 'sync_space_with_stripe';

-- 2. Créer une fonction RPC pour l'appel manuel depuis le frontend
CREATE OR REPLACE FUNCTION public.sync_space_with_stripe_manual(space_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    space_record RECORD;
    payload JSONB;
    response JSONB;
    response_status INTEGER;
    response_body TEXT;
BEGIN
    -- Récupérer les données de l'espace
    SELECT * INTO space_record 
    FROM spaces 
    WHERE id = space_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Espace non trouvé',
            'space_id', space_id
        );
    END IF;

    -- Construire le payload pour l'edge function
    payload := jsonb_build_object(
        'type', 'MANUAL_SYNC',
        'table', 'spaces',
        'record', to_jsonb(space_record),
        'old_record', NULL
    );

    -- Appeler l'edge function via la fonction wrapper sécurisée
    response := secure_http_post(
        'https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe',
        jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
        ),
        payload
    );
    
    response_status := (response->>'status')::INTEGER;
    response_body := response->>'content';

    -- Log de debug
    RAISE LOG 'Stripe sync manual: space % (status: %, response: %)',
        space_id,
        response_status,
        response_body;

    -- Retourner le résultat
    RETURN jsonb_build_object(
        'success', response_status >= 200 AND response_status < 300,
        'status', response_status,
        'response', response_body,
        'space_id', space_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Log de l'erreur
    RAISE LOG 'Erreur dans sync_space_with_stripe_manual: %', SQLERRM;
    
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM,
        'space_id', space_id
    );
END;
$$;

-- 3. Donner les permissions sur la fonction RPC
GRANT EXECUTE ON FUNCTION public.sync_space_with_stripe_manual(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_space_with_stripe_manual(UUID) TO service_role;

-- 4. Commenter la fonction
COMMENT ON FUNCTION public.sync_space_with_stripe_manual(UUID) IS 
'Fonction RPC pour synchroniser manuellement un espace avec Stripe depuis le frontend';

-- 5. Vérifier que les fonctions sont créées
SELECT 'VERIFICATION FONCTIONS' as info;
SELECT 
    proname,
    proargtypes,
    proargnames,
    prosecdef
FROM pg_proc 
WHERE proname IN ('sync_space_with_stripe', 'sync_space_with_stripe_manual')
ORDER BY proname;

-- 6. Tester la fonction RPC avec un espace existant
SELECT 'TEST FONCTION RPC' as info;
SELECT 
    id,
    name,
    sync_space_with_stripe_manual(id) as sync_result
FROM spaces 
LIMIT 1; 