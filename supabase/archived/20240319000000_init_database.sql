-- Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.bookings CASCADE;
DROP TABLE IF EXISTS public.spaces CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.google_business_config CASCADE;
DROP TABLE IF EXISTS public.admin_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.email_logs CASCADE;
DROP TABLE IF EXISTS public.chat_conversations CASCADE;
DROP TABLE IF EXISTS public.application_logs CASCADE;

-- Supprimer les fonctions existantes
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.make_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_popular_spaces() CASCADE;
DROP FUNCTION IF EXISTS public.get_bookings() CASCADE;

-- Créer la fonction handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer la fonction is_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer la fonction make_admin
CREATE OR REPLACE FUNCTION public.make_admin(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer la fonction get_popular_spaces
CREATE OR REPLACE FUNCTION public.get_popular_spaces(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price DECIMAL,
  booking_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.price,
    COUNT(b.id) as booking_count
  FROM public.spaces s
  LEFT JOIN public.bookings b ON s.id = b.space_id
  GROUP BY s.id
  ORDER BY booking_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer la fonction get_bookings
CREATE OR REPLACE FUNCTION public.get_bookings(
  start_date TIMESTAMPTZ DEFAULT NULL,
  end_date TIMESTAMPTZ DEFAULT NULL,
  p_space_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  space_id UUID,
  user_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT,
  price_ht DECIMAL,
  price_ttc DECIMAL,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.space_id,
    b.user_id,
    b.start_time,
    b.end_time,
    b.status,
    b.price_ht,
    b.price_ttc,
    b.created_at
  FROM public.bookings b
  WHERE 
    (start_date IS NULL OR b.start_time >= start_date)
    AND (end_date IS NULL OR b.end_time <= end_date)
    AND (p_space_id IS NULL OR b.space_id = p_space_id)
    AND (b.user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer la table profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table google_business_config
CREATE TABLE IF NOT EXISTS public.google_business_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table admin_settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table email_templates
CREATE TABLE IF NOT EXISTS public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  html TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table email_logs
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  message_id VARCHAR(255),
  metadata JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table chat_conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table application_logs
CREATE TABLE IF NOT EXISTS public.application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table spaces
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL NOT NULL,
  pricing_type TEXT DEFAULT 'hourly' CHECK (pricing_type IN ('hourly', 'half_day', 'quarter_day')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID REFERENCES public.spaces(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  price_ht DECIMAL NOT NULL,
  price_ttc DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Créer la table invoices
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_business_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Créer toutes les politiques RLS après la création des tables
CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Tout le monde peut voir les espaces"
    ON spaces FOR SELECT
    USING (true);

CREATE POLICY "Tout le monde peut voir les réservations"
    ON bookings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs réservations"
    ON bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs réservations"
    ON bookings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs réservations"
    ON bookings FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent voir leurs factures"
    ON invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Tout le monde peut voir les templates d'email"
    ON email_templates FOR SELECT
    USING (true);

CREATE POLICY "Les utilisateurs peuvent voir leurs conversations"
    ON chat_conversations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent créer leurs conversations"
    ON chat_conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent modifier leurs conversations"
    ON chat_conversations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent supprimer leurs conversations"
    ON chat_conversations FOR DELETE
    USING (auth.uid() = user_id);

-- Créer les triggers pour updated_at
CREATE TRIGGER handle_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_admin_users
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_google_business_config
  BEFORE UPDATE ON public.google_business_config
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_admin_settings
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_email_templates
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_email_logs
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_chat_conversations
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_spaces
  BEFORE UPDATE ON public.spaces
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at_bookings
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insérer les paramètres par défaut
INSERT INTO public.admin_settings (key, value, description)
VALUES 
  ('site_name', '"Canard Cowork Space"', 'Nom du site'),
  ('contact_email', '"contact@canard-cowork.space"', 'Email de contact'),
  ('opening_hours', '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00"}', 'Heures d''ouverture'),
  ('address', '{"street": "123 Rue du Canard", "city": "Paris", "postal_code": "75001", "country": "France"}', 'Adresse du coworking'),
  ('social_media', '{"facebook": "https://facebook.com/canardcowork", "twitter": "https://twitter.com/canardcowork", "instagram": "https://instagram.com/canardcowork"}', 'Liens des réseaux sociaux'),
  ('stripe_public_key', '""', 'Clé publique Stripe'),
  ('stripe_secret_key', '""', 'Clé secrète Stripe'),
  ('cookie_settings', '{"necessary": true, "analytics": false, "marketing": false}', 'Paramètres des cookies')
ON CONFLICT (key) DO NOTHING;

-- Insérer les templates d'emails par défaut
INSERT INTO public.email_templates (name, description, subject, content, html)
VALUES 
  (
    'booking_confirmation', 
    'Email envoyé après une réservation confirmée', 
    'Confirmation de votre réservation',
    'Bonjour {{ first_name }},\n\nNous vous confirmons votre réservation de l''espace {{ space_name }} du {{ start_date }} au {{ end_date }}.\n\nMerci de votre confiance,\nL''équipe {{ site_name }}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #333;">Confirmation de réservation</h1>
      </div>
      <div style="margin-bottom: 20px;">
        <p>Bonjour {{ first_name }},</p>
        <p>Nous vous confirmons votre réservation de l''espace <strong>{{ space_name }}</strong>.</p>
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Détails de la réservation :</strong></p>
          <ul style="list-style-type: none; padding-left: 0;">
            <li>📅 <strong>Date de début :</strong> {{ start_date }}</li>
            <li>📅 <strong>Date de fin :</strong> {{ end_date }}</li>
            <li>💰 <strong>Montant total :</strong> {{ amount }} {{ currency }}</li>
          </ul>
        </div>
        <p>Vous trouverez en pièce jointe votre facture.</p>
        <p>Nous vous remercions de votre confiance et sommes impatients de vous accueillir.</p>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>Cordialement,<br>L''équipe {{ site_name }}</p>
      </div>
    </div>'
  ),
  (
    'welcome_email', 
    'Email envoyé après l''inscription d''un nouvel utilisateur', 
    'Bienvenue sur {{ site_name }}',
    'Bonjour {{ first_name }},\n\nNous vous souhaitons la bienvenue sur {{ site_name }}. Nous sommes ravis de vous compter parmi nos utilisateurs.\n\nCordialement,\nL''équipe {{ site_name }}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #333;">Bienvenue sur {{ site_name }}</h1>
      </div>
      <div style="margin-bottom: 20px;">
        <p>Bonjour {{ first_name }},</p>
        <p>Nous vous souhaitons la bienvenue sur notre plateforme de réservation d''espaces de coworking.</p>
        <p>Vous pouvez dès maintenant :</p>
        <ul>
          <li>Explorer nos différents espaces</li>
          <li>Effectuer des réservations</li>
          <li>Gérer votre profil</li>
        </ul>
        <p>N''hésitez pas à nous contacter si vous avez des questions.</p>
      </div>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 12px;">
        <p>Cordialement,<br>L''équipe {{ site_name }}</p>
      </div>
    </div>'
  )
ON CONFLICT (name) DO NOTHING;

-- Créer l'utilisateur admin par défaut si nécessaire
DO $$
DECLARE
  admin_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'contact@canard-cowork.space') THEN
    admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
    VALUES (
      admin_id,
      'contact@canard-cowork.space',
      crypt('admin123', gen_salt('bf')),
      now(),
      'authenticated'
    );

    INSERT INTO public.profiles (id, email, full_name, role, is_admin)
    VALUES (
      admin_id,
      'contact@canard-cowork.space',
      'Admin Canard',
      'admin',
      true
    );
  END IF;
END $$;

-- Notifier PostgREST de recharger le cache du schéma
NOTIFY pgrst, 'reload schema'; 