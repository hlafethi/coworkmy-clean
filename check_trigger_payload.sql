-- Vérifier le contenu exact du trigger
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'enqueue_stripe_sync';

-- Vérifier si les colonnes de prix existent dans la table spaces
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'spaces' 
  AND column_name IN (
    'hourly_price', 'daily_price', 'half_day_price', 
    'monthly_price', 'quarter_price', 'yearly_price', 'custom_price'
  )
ORDER BY column_name;

-- Vérifier les données de prix pour un espace spécifique
SELECT 
  id,
  name,
  pricing_type,
  hourly_price,
  daily_price,
  half_day_price,
  monthly_price,
  quarter_price,
  yearly_price,
  custom_price
FROM spaces 
WHERE id = 'c32e492a-c39c-4641-8650-6383db01451b'; 