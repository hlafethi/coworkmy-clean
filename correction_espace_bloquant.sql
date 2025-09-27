-- =====================================================
-- CORRECTION DE L'ESPACE BLOQUANT
-- =====================================================

-- 1. Identifier l'espace qui pose problème
-- Remplace 'f5259ce9-0f7c-407f-a730-88b9820c60a9' par l'ID de l'espace problématique
-- ou utilise cette requête pour voir tous les espaces avec des jobs en attente

SELECT 
    s.id as space_id,
    s.name as space_name,
    ssq.id as queue_id,
    ssq.event_type,
    ssq.status,
    ssq.created_at,
    ssq.updated_at
FROM public.spaces s
JOIN public.stripe_sync_queue ssq ON s.id = ssq.space_id
WHERE ssq.status = 'pending'
ORDER BY ssq.created_at DESC;

-- 2. Voir spécifiquement les jobs pour un espace donné
-- Remplace 'SPACE_ID_HERE' par l'ID de l'espace problématique
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at,
    updated_at,
    payload
FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE'  -- Remplace par l'ID réel
ORDER BY created_at DESC;

-- 3. Supprimer tous les jobs pour un espace spécifique
-- ATTENTION: Cette requête supprime TOUS les jobs pour cet espace
-- Utilise-la seulement si tu veux repartir de zéro

-- DELETE FROM public.stripe_sync_queue
-- WHERE space_id = 'SPACE_ID_HERE';  -- Remplace par l'ID réel

-- 4. Supprimer seulement les jobs en statut 'pending' pour un espace
-- Plus sûr que la requête précédente
DELETE FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE'  -- Remplace par l'ID réel
AND status = 'pending';

-- 5. Supprimer les doublons pour un espace spécifique
-- Garde le job le plus récent
DELETE FROM public.stripe_sync_queue
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY space_id, event_type 
                   ORDER BY created_at DESC
               ) as rn
        FROM public.stripe_sync_queue
        WHERE space_id = 'SPACE_ID_HERE'  -- Remplace par l'ID réel
    ) t
    WHERE t.rn > 1
);

-- 6. Vérifier qu'il n'y a plus de conflits pour cet espace
SELECT 
    space_id, 
    event_type, 
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE'  -- Remplace par l'ID réel
GROUP BY space_id, event_type
HAVING COUNT(*) > 1;

-- 7. Voir les jobs restants pour cet espace
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at
FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE'  -- Remplace par l'ID réel
ORDER BY created_at DESC;

-- =====================================================
-- SCRIPT DE NETTOYAGE GÉNÉRAL (plus sûr)
-- =====================================================

-- Alternative: Nettoyer tous les jobs problématiques en une fois
-- Cette requête supprime:
-- - Les jobs avec des valeurs NULL
-- - Les jobs bloqués (plus de 1 heure)
-- - Les doublons (garde le plus récent)
-- - Les jobs avec des statuts invalides

-- BEGIN;
-- 
-- -- Supprimer les jobs avec des valeurs NULL
-- DELETE FROM public.stripe_sync_queue
-- WHERE space_id IS NULL OR event_type IS NULL OR status IS NULL;
-- 
-- -- Supprimer les jobs bloqués
-- DELETE FROM public.stripe_sync_queue
-- WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';
-- 
-- -- Supprimer les doublons
-- DELETE FROM public.stripe_sync_queue
-- WHERE id IN (
--     SELECT id FROM (
--         SELECT id,
--                ROW_NUMBER() OVER (
--                    PARTITION BY space_id, event_type 
--                    ORDER BY created_at DESC
--                ) as rn
--         FROM public.stripe_sync_queue
--     ) t
--     WHERE t.rn > 1
-- );
-- 
-- -- Supprimer les jobs avec des statuts invalides
-- DELETE FROM public.stripe_sync_queue
-- WHERE status NOT IN ('pending', 'processing', 'completed', 'failed');
-- 
-- COMMIT; 