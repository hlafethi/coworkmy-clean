-- Vérifier si le trigger de synchronisation Stripe existe
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_stripe_sync_on_spaces';

-- Vérifier si la fonction existe
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'sync_space_with_stripe';

-- Vérifier les triggers sur la table spaces
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'spaces'; 