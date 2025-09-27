ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'live';
 
-- Optionnel : index pour filtrer rapidement par mode
CREATE INDEX IF NOT EXISTS idx_payments_mode ON public.payments(mode); 