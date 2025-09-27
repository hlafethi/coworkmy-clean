-- Migration : Mise à jour des prix demi-journée
UPDATE spaces
SET half_day_price = 15
WHERE pricing_type = 'half_day' AND (half_day_price IS NULL OR half_day_price <= 0); 