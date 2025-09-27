-- =====================================================
-- NETTOYAGE DE LA TABLE stripe_sync_queue
-- =====================================================

-- ATTENTION: Exécuter ces requêtes avec précaution
-- Commencer par faire un backup si nécessaire

-- 1. Supprimer les enregistrements avec des valeurs NULL problématiques
DELETE FROM public.stripe_sync_queue
WHERE space_id IS NULL 
   OR event_type IS NULL 
   OR status IS NULL;

-- 2. Supprimer les jobs bloqués (plus de 1 heure en statut 'pending')
DELETE FROM public.stripe_sync_queue
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour';

-- 3. Supprimer les doublons en gardant le plus récent
-- (Cette requête supprime les anciens doublons)
DELETE FROM public.stripe_sync_queue
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY space_id, event_type 
                   ORDER BY created_at DESC
               ) as rn
        FROM public.stripe_sync_queue
    ) t
    WHERE t.rn > 1
);

-- 4. Supprimer les jobs avec des statuts invalides
DELETE FROM public.stripe_sync_queue
WHERE status NOT IN ('pending', 'processing', 'completed', 'failed');

-- 5. Nettoyer les jobs très anciens (plus de 7 jours)
DELETE FROM public.stripe_sync_queue
WHERE created_at < NOW() - INTERVAL '7 days';

-- 6. Vérifier le résultat du nettoyage
SELECT 
    status,
    COUNT(*) as count
FROM public.stripe_sync_queue
GROUP BY status
ORDER BY count DESC;

-- 7. Vérifier qu'il n'y a plus de doublons
SELECT 
    space_id, 
    event_type, 
    COUNT(*) as count
FROM public.stripe_sync_queue
GROUP BY space_id, event_type
HAVING COUNT(*) > 1;

-- 8. Afficher les jobs restants
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at
FROM public.stripe_sync_queue
ORDER BY created_at DESC
LIMIT 10; 