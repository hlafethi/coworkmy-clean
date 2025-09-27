-- =====================================================
-- NETTOYAGE FINAL - ESPACE TEST
-- =====================================================

-- 1. Voir le job restant pour l'espace test
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at,
    updated_at,
    payload
FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9'
ORDER BY created_at DESC;

-- 2. Supprimer TOUS les jobs pour l'espace test (peu importe le statut)
DELETE FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9';

-- 3. Vérifier que c'est bien supprimé
SELECT 
    'Jobs restants pour espace test' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9';

-- 4. Voir les jobs en pending restants
SELECT 
    s.name as space_name,
    ssq.event_type,
    ssq.status,
    ssq.created_at
FROM public.spaces s
JOIN public.stripe_sync_queue ssq ON s.id = ssq.space_id
WHERE ssq.status = 'pending'
ORDER BY ssq.created_at DESC
LIMIT 10; 