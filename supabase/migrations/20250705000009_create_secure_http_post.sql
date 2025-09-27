-- Migration pour créer la fonction wrapper sécurisée secure_http_post
-- Cette fonction encapsule net.http_post avec un search_path sécurisé

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS public.secure_http_post(TEXT, JSONB, JSONB) CASCADE;

-- Créer la fonction wrapper sécurisée
CREATE OR REPLACE FUNCTION secure_http_post(
    url TEXT,
    headers JSONB DEFAULT '{}'::JSONB,
    body JSONB DEFAULT '{}'::JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = net, public
AS $$
BEGIN
    -- Appeler la fonction net.http_post avec les paramètres fournis
    RETURN net.http_post(
        url,
        body,
        '{}'::jsonb, -- params vides
        headers,
        5000         -- timeout en ms (5 secondes)
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur et retourner un objet d'erreur
        RAISE WARNING 'Erreur dans secure_http_post: %', SQLERRM;
        RETURN jsonb_build_object(
            'error', true,
            'message', SQLERRM,
            'url', url
        );
END;
$$;

-- Vérifier que la fonction a été créée
SELECT 
    proname as function_name,
    proargtypes::regtype[] as argument_types,
    prorettype::regtype as return_type
FROM pg_proc 
WHERE proname = 'secure_http_post';

-- Test de la fonction
SELECT secure_http_post(
    'https://httpbin.org/post',
    '{"Content-Type": "application/json"}'::jsonb,
    '{"test": "data"}'::jsonb
); 