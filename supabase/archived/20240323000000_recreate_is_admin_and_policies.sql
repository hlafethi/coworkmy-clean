-- Supprimer toutes les policies qui utilisent la fonction is_admin
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'homepage_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Écriture admin homepage" ON public.homepage_settings;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les profils" ON public.profiles;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Les administrateurs peuvent voir les utilisateurs admin" ON public.admin_users;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'google_business_config') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Seuls les administrateurs peuvent modifier la configuration" ON public.google_business_config;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promotions') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Les administrateurs peuvent gérer les promotions" ON public.promotions;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'space_equipment') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Les administrateurs peuvent gérer les équipements" ON public.space_equipment;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Les administrateurs peuvent voir toutes les notifications" ON public.notifications;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bookings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Les administrateurs peuvent voir toutes les réservations" ON public.bookings;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Les administrateurs peuvent voir toutes les factures" ON public.invoices;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'application_logs') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Seuls les administrateurs peuvent voir les logs" ON public.application_logs;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Seuls les administrateurs peuvent voir les logs" ON public.email_logs;';
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_settings') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Écriture admin stripe settings" ON public.stripe_settings;';
    END IF;
END $$;

-- Supprimer la fonction
DROP FUNCTION IF EXISTS public.is_admin();

-- Recréer la fonction avec search_path sécurisé
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- Recréer les policies
CREATE POLICY "Les administrateurs peuvent voir tous les profils"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Les administrateurs peuvent voir les utilisateurs admin"
    ON public.admin_users FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Seuls les administrateurs peuvent modifier la configuration"
    ON public.google_business_config FOR ALL
    USING (public.is_admin());

CREATE POLICY "Les administrateurs peuvent gérer les promotions"
    ON public.promotions FOR ALL
    USING (public.is_admin());

CREATE POLICY "Les administrateurs peuvent gérer les équipements"
    ON public.space_equipment FOR ALL
    USING (public.is_admin());

CREATE POLICY "Les administrateurs peuvent voir toutes les notifications"
    ON public.notifications FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Les administrateurs peuvent voir toutes les réservations"
    ON public.bookings FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Les administrateurs peuvent voir toutes les factures"
    ON public.invoices FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Seuls les administrateurs peuvent voir les logs"
    ON public.application_logs FOR ALL
    USING (public.is_admin());

CREATE POLICY "Seuls les administrateurs peuvent voir les logs"
    ON public.email_logs FOR ALL
    USING (public.is_admin());

CREATE POLICY "Écriture admin stripe settings" ON public.stripe_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin()); 