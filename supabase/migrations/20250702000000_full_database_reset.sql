-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Fonction pour mettre à jour le champ updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Table `profiles`
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT false,
  first_name TEXT,
  last_name TEXT,
  address_street TEXT,
  address_city TEXT,
  address_postal_code TEXT,
  address_country TEXT,
  birth_date DATE,
  phone TEXT,
  company_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction pour gérer la création d'un nouveau profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$;

-- Déclencheur (trigger) pour créer un profil lors de l'inscription
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- RLS pour `profiles`
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil." ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Les utilisateurs peuvent mettre à jour leur propre profil." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Table `spaces`
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER NOT NULL,
  image_url TEXT,
  pricing_type TEXT NOT NULL DEFAULT 'hourly' CHECK (pricing_type IN ('hourly', 'daily', 'monthly')),
  price_ht NUMERIC(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS pour `spaces`
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tout le monde peut voir les espaces." ON public.spaces FOR SELECT USING (true);

-- Table `time_slots`
CREATE TABLE IF NOT EXISTS public.time_slots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    space_id UUID REFERENCES public.spaces(id) ON DELETE CASCADE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    label TEXT NOT NULL,
    is_available BOOLEAN DEFAULT true,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS pour `time_slots`
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tout le monde peut voir les créneaux." ON public.time_slots FOR SELECT USING (true);


-- Table `bookings`
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  space_id UUID REFERENCES public.spaces(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_price_ht NUMERIC(10, 2) NOT NULL,
  total_price_ttc NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS pour `bookings`
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Les utilisateurs peuvent voir leurs propres réservations." ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent créer leurs propres réservations." ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Les utilisateurs peuvent mettre à jour leurs propres réservations." ON public.bookings FOR UPDATE USING (auth.uid() = user_id);


-- Table `admin_settings`
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS pour `admin_settings`
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tout le monde peut voir les paramètres." ON public.admin_settings FOR SELECT USING (true);

--- Fonction et politiques pour les administrateurs ---

-- La fonction `is_admin`
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

-- RLS Admin pour `profiles`
CREATE POLICY "Les administrateurs peuvent voir tous les profils." ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "Les administrateurs peuvent tout gérer sur les profils." ON public.profiles FOR ALL USING (public.is_admin());

-- RLS Admin pour `spaces`
CREATE POLICY "Les administrateurs peuvent tout gérer sur les espaces." ON public.spaces FOR ALL USING (public.is_admin());

-- RLS Admin pour `time_slots`
CREATE POLICY "Les administrateurs peuvent tout gérer sur les créneaux." ON public.time_slots FOR ALL USING (public.is_admin());

-- RLS Admin pour `bookings`
CREATE POLICY "Les administrateurs peuvent voir toutes les réservations." ON public.bookings FOR SELECT USING (public.is_admin());
CREATE POLICY "Les administrateurs peuvent tout gérer sur les réservations." ON public.bookings FOR ALL USING (public.is_admin());

-- RLS Admin pour `admin_settings`
CREATE POLICY "Les administrateurs peuvent tout gérer sur les paramètres." ON public.admin_settings FOR ALL USING (public.is_admin());


-- Triggers pour `updated_at`
CREATE TRIGGER handle_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_spaces_updated_at BEFORE UPDATE ON public.spaces FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_time_slots_updated_at BEFORE UPDATE ON public.time_slots FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER handle_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at(); 