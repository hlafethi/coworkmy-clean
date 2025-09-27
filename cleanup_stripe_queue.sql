-- Nettoyage de la file d'attente Stripe
DELETE FROM stripe_sync_queue WHERE status IN ('pending', 'error'); 