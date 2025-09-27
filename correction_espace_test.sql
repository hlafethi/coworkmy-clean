-- =====================================================
-- CORRECTION SPÉCIFIQUE POUR L'ESPACE "test"
-- ID: f5259ce9-0f7c-407f-a730-88b9820c60a9
-- =====================================================

-- 1. Voir tous les jobs pour l'espace "test"
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at,
    updated_at
FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9'
ORDER BY created_at DESC;

-- 2. Supprimer TOUS les jobs en attente pour l'espace "test"
-- Cela va nettoyer les 3 jobs problématiques
DELETE FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9'
AND status = 'pending';

-- 3. Vérifier que le nettoyage a fonctionné
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at
FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9'
ORDER BY created_at DESC;

-- 4. Vérifier qu'il n'y a plus de conflits pour cet espace
SELECT 
    space_id, 
    event_type, 
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9'
GROUP BY space_id, event_type
HAVING COUNT(*) > 1; 