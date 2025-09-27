-- =====================================================
-- 1. Nettoyage des politiques RLS en double
-- =====================================================

-- Supprimer les politiques en double pour bookings
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs propres réservations." ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow select for authenticated" ON public.bookings;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres réservations." ON public.bookings;
DROP POLICY IF EXISTS "User can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Les utilisateurs peuvent mettre à jour leurs propres réservat" ON public.bookings;

-- Supprimer les politiques en double pour payments
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs propres paiements" ON public.payments;
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;

-- =====================================================
-- 2. Vérification de l'état actuel des politiques RLS
-- =====================================================

-- Voir toutes les politiques actives sur bookings, payments
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('bookings', 'payments')
ORDER BY tablename, cmd;

-- Vérifier si la fonction is_admin existe
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'is_admin';

-- =====================================================
-- 3. Sécurisation complète des droits utilisateurs (RLS)
-- =====================================================

-- Fonction is_admin (sécurisée)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- =====================
-- BOOKINGS
-- =====================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view own bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Users can view own bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own bookings" ON public.bookings
      FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END
$$;

-- Users can create own bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Users can create own bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can create own bookings" ON public.bookings
      FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END
$$;

-- Users can update own bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Users can update own bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can update own bookings" ON public.bookings
      FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END
$$;

-- Users can delete own bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Users can delete own bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own bookings" ON public.bookings
      FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END
$$;

-- Admins can view all bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Admins can view all bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all bookings" ON public.bookings
      FOR SELECT USING (public.is_admin())';
  END IF;
END
$$;

-- Admins can manage all bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'bookings' AND policyname = 'Admins can manage all bookings'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage all bookings" ON public.bookings
      FOR ALL USING (public.is_admin())';
  END IF;
END
$$;

-- =====================
-- PAYMENTS
-- =====================
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view own payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Users can view own payments'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can view own payments" ON public.payments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.bookings b
          WHERE b.id = booking_id AND b.user_id = auth.uid()
        )
      )';
  END IF;
END
$$;

-- System can insert payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'System can insert payments'
  ) THEN
    EXECUTE 'CREATE POLICY "System can insert payments" ON public.payments
      FOR INSERT TO service_role, authenticated WITH CHECK (true)';
  END IF;
END
$$;

-- Admins can view all payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Admins can view all payments'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can view all payments" ON public.payments
      FOR SELECT USING (public.is_admin())';
  END IF;
END
$$;

-- Admins can manage all payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'payments' AND policyname = 'Admins can manage all payments'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage all payments" ON public.payments
      FOR ALL USING (public.is_admin())';
  END IF;
END
$$;

-- =====================
-- Vérification finale
-- =====================
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('bookings', 'payments')
ORDER BY tablename, cmd; 