-- Nettoyage complet de la file d'attente Stripe pour éviter les boucles
-- Ce script supprime tous les jobs en attente et marque les jobs en erreur comme terminés

-- 1. Supprimer tous les jobs en attente (évite les boucles)
DELETE FROM public.stripe_sync_queue WHERE status = 'pending';

-- 2. Marquer les jobs en erreur comme terminés pour éviter qu'ils soient retraités
UPDATE public.stripe_sync_queue 
SET status = 'done', 
    processed_at = now(),
    error_message = COALESCE(error_message, 'Job marqué comme terminé lors du nettoyage')
WHERE status = 'error';

-- 3. Vérifier le statut après nettoyage
SELECT 
    status,
    COUNT(*) as count
FROM public.stripe_sync_queue 
GROUP BY status
ORDER BY status;

-- 4. Log du nettoyage
DO $$
BEGIN
    RAISE NOTICE 'File d''attente Stripe nettoyée avec succès';
    RAISE NOTICE 'Tous les jobs en attente ont été supprimés';
    RAISE NOTICE 'Tous les jobs en erreur ont été marqués comme terminés';
END $$;

-- Relancer la synchronisation pour tous les espaces
INSERT INTO stripe_sync_queue (space_id, event_type, payload)
SELECT 
  id,
  'INSERT',
  jsonb_build_object(
    'id', id,
    'name', name,
    'description', NULLIF(description, ''),
    'pricing_type', pricing_type,
    'hourly_price', hourly_price,
    'daily_price', daily_price,
    'half_day_price', half_day_price,
    'monthly_price', monthly_price,
    'quarter_price', quarter_price,
    'yearly_price', yearly_price,
    'custom_price', custom_price,
    'stripe_product_id', stripe_product_id,
    'stripe_price_id', stripe_price_id
  )
FROM spaces 
WHERE is_active = true;

-- Vérifier les nouveaux jobs créés
SELECT 
  space_id,
  payload->>'name' as space_name,
  payload->>'monthly_price' as monthly_price,
  created_at
FROM stripe_sync_queue 
ORDER BY created_at DESC;

-- Vérifier les espaces qui ont des IDs Stripe
SELECT 
  id,
  name,
  stripe_product_id,
  stripe_price_id,
  last_stripe_sync
FROM spaces 
WHERE stripe_product_id IS NOT NULL 
   OR stripe_price_id IS NOT NULL
ORDER BY name;

-- Vérifier la structure de la table spaces (pour debug)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'spaces' 
  AND column_name IN ('id', 'name', 'stripe_product_id', 'stripe_price_id', 'last_stripe_sync', 'payload')
ORDER BY ordinal_position; 