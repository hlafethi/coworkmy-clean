-- Vérifier l'état de la synchronisation Stripe
SELECT 
  s.id,
  s.name,
  s.pricing_type,
  s.monthly_price,
  s.hourly_price,
  s.stripe_product_id,
  s.stripe_price_id,
  s.last_stripe_sync,
  CASE 
    WHEN s.stripe_product_id IS NULL THEN '❌ Non synchronisé'
    WHEN s.stripe_price_id IS NULL THEN '⚠️ Produit créé, prix manquant'
    ELSE '✅ Synchronisé'
  END as sync_status
FROM spaces s
WHERE s.is_active = true
ORDER BY sync_status, s.name;

-- Compter les espaces par statut de synchronisation
SELECT 
  CASE 
    WHEN stripe_product_id IS NULL THEN 'Non synchronisé'
    WHEN stripe_price_id IS NULL THEN 'Produit créé, prix manquant'
    ELSE 'Synchronisé'
  END as status,
  COUNT(*) as count
FROM spaces 
WHERE is_active = true
GROUP BY 
  CASE 
    WHEN stripe_product_id IS NULL THEN 'Non synchronisé'
    WHEN stripe_price_id IS NULL THEN 'Produit créé, prix manquant'
    ELSE 'Synchronisé'
  END;

-- Vérifier les jobs en attente dans la file
SELECT 
  COUNT(*) as jobs_en_attente,
  COUNT(DISTINCT space_id) as espaces_uniques
FROM stripe_sync_queue; 