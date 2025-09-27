-- Diagnostic : tous les triggers sur la table spaces
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'spaces';

-- Diagnostic : toutes les fonctions qui insèrent dans stripe_sync_queue
SELECT 
  proname, 
  prosrc 
FROM pg_proc 
WHERE prosrc LIKE '%stripe_sync_queue%';

-- =====================================================
-- DIAGNOSTIC COMPLET DE LA TABLE stripe_sync_queue
-- =====================================================

-- 1. Vérifier la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'stripe_sync_queue' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes UNIQUE
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'stripe_sync_queue' 
AND tc.table_schema = 'public'
AND tc.constraint_type = 'UNIQUE';

-- 3. Compter le nombre total d'enregistrements
SELECT COUNT(*) as total_records FROM public.stripe_sync_queue;

-- 4. Identifier les doublons potentiels
SELECT 
    space_id, 
    event_type, 
    COUNT(*) as duplicate_count
FROM public.stripe_sync_queue
GROUP BY space_id, event_type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 5. Voir tous les enregistrements récents
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at,
    updated_at,
    payload
FROM public.stripe_sync_queue
ORDER BY created_at DESC
LIMIT 20;

-- 6. Vérifier les enregistrements avec des valeurs NULL problématiques
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at
FROM public.stripe_sync_queue
WHERE space_id IS NULL 
   OR event_type IS NULL 
   OR status IS NULL;

-- 7. Vérifier les espaces qui ont des jobs en attente
SELECT 
    s.id as space_id,
    s.name as space_name,
    ssq.event_type,
    ssq.status,
    ssq.created_at
FROM public.spaces s
JOIN public.stripe_sync_queue ssq ON s.id = ssq.space_id
WHERE ssq.status = 'pending'
ORDER BY ssq.created_at DESC;

-- 8. Identifier les jobs bloqués (plus de 1 heure)
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM public.stripe_sync_queue
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC; 