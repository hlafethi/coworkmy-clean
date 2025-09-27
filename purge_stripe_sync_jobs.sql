-- Purger tous les jobs en erreur ou en attente dans stripe_sync_queue
DELETE FROM stripe_sync_queue WHERE status = 'error' OR status = 'pending';

-- Vérifier qu'il ne reste que les jobs terminés
SELECT status, COUNT(*) as nombre FROM stripe_sync_queue GROUP BY status; 