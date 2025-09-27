-- Création de la table notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking', 'system', 'payment', 'support')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leurs notifications" ON public.notifications;
CREATE POLICY "Les utilisateurs peuvent voir leurs notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les administrateurs peuvent voir toutes les notifications" ON public.notifications;
CREATE POLICY "Les administrateurs peuvent voir toutes les notifications"
    ON public.notifications FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- Création de la table reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Tout le monde peut voir les avis" ON public.reviews;
CREATE POLICY "Tout le monde peut voir les avis"
    ON public.reviews FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leurs avis" ON public.reviews;
CREATE POLICY "Les utilisateurs peuvent créer leurs avis"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leurs avis" ON public.reviews;
CREATE POLICY "Les utilisateurs peuvent modifier leurs avis"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_reviews_space_id ON public.reviews(space_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- Création de la table promotions
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    discount_percent INTEGER CHECK (discount_percent > 0 AND discount_percent <= 100),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Tout le monde peut voir les promotions actives" ON public.promotions;
CREATE POLICY "Tout le monde peut voir les promotions actives"
    ON public.promotions FOR SELECT
    USING (is_active = true AND NOW() BETWEEN start_date AND end_date);

DROP POLICY IF EXISTS "Les administrateurs peuvent gérer les promotions" ON public.promotions;
CREATE POLICY "Les administrateurs peuvent gérer les promotions"
    ON public.promotions FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Index
CREATE INDEX IF NOT EXISTS idx_promotions_code ON public.promotions(code);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON public.promotions(start_date, end_date);

-- Création de la table space_equipment
CREATE TABLE IF NOT EXISTS public.space_equipment (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.space_equipment ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
DROP POLICY IF EXISTS "Tout le monde peut voir les équipements" ON public.space_equipment;
CREATE POLICY "Tout le monde peut voir les équipements"
    ON public.space_equipment FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Les administrateurs peuvent gérer les équipements" ON public.space_equipment;
CREATE POLICY "Les administrateurs peuvent gérer les équipements"
    ON public.space_equipment FOR ALL
    USING (auth.jwt() ->> 'role' = 'admin');

-- Index
CREATE INDEX IF NOT EXISTS idx_space_equipment_space_id ON public.space_equipment(space_id);

-- Ajout des triggers pour updated_at
CREATE TRIGGER handle_updated_at_notifications
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_reviews
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_promotions
    BEFORE UPDATE ON public.promotions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_space_equipment
    BEFORE UPDATE ON public.space_equipment
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at(); 