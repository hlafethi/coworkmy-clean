-- =====================================================
-- DIAGNOSTIC COMPLET - ERREUR 409 PERSISTANTE
-- =====================================================

-- 1. Vérifier s'il y a encore des jobs pour l'espace "test"
SELECT 
    'Jobs pour espace test' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id = 'f5259ce9-0f7c-407f-a730-88b9820c60a9'

UNION ALL

-- 2. Vérifier s'il y a des doublons dans toute la table
SELECT 
    'Doublons totaux' as info,
    COUNT(*) as count
FROM (
    SELECT space_id, event_type
    FROM public.stripe_sync_queue
    GROUP BY space_id, event_type
    HAVING COUNT(*) > 1
) t

UNION ALL

-- 3. Vérifier les jobs récents (dernières 24h)
SELECT 
    'Jobs récents (24h)' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

-- 4. Vérifier les jobs en statut 'pending'
SELECT 
    'Jobs en pending' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE status = 'pending';

-- 5. Voir tous les jobs récents avec détails
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at,
    updated_at
FROM public.stripe_sync_queue
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 6. Vérifier la structure de la contrainte UNIQUE
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'stripe_sync_queue' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'UNIQUE'
GROUP BY tc.constraint_name, tc.constraint_type;

-- 7. Vérifier s'il y a des valeurs NULL problématiques
SELECT 
    'Valeurs NULL' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id IS NULL 
   OR event_type IS NULL 
   OR status IS NULL;

-- 8. Vérifier les types de données
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stripe_sync_queue' 
AND table_schema = 'public'
AND column_name IN ('space_id', 'event_type', 'status')
ORDER BY ordinal_position; 