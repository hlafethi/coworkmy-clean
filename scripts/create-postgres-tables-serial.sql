-- Script de création des tables pour la base de données PostgreSQL

-- Création de la table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des espaces
CREATE TABLE IF NOT EXISTS spaces (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  capacity INTEGER,
  price_per_hour DECIMAL(10, 2),
  price_per_day DECIMAL(10, 2),
  price_per_month DECIMAL(10, 2),
  price_per_half_day DECIMAL(10, 2),
  price_per_quarter_day DECIMAL(10, 2),
  pricing_type TEXT CHECK (pricing_type IN ('hourly', 'daily', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des réservations
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  space_id INTEGER NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_price DECIMAL(10, 2),
  total_price_ht DECIMAL(10, 2),
  total_price_ttc DECIMAL(10, 2),
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_start_before_end CHECK (start_time < end_time)
);

-- Création de la table des créneaux horaires
CREATE TABLE IF NOT EXISTS time_slots (
  id SERIAL PRIMARY KEY,
  space_id INTEGER NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT time_slots_start_before_end CHECK (start_time < end_time)
);

-- Création de la table des paramètres d'administration
CREATE TABLE IF NOT EXISTS admin_settings (
  id SERIAL PRIMARY KEY,
  site_name TEXT NOT NULL,
  contact_email TEXT,
  phone_number TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  cta_text TEXT,
  features_title TEXT,
  features_subtitle TEXT,
  stripe_test_publishable_key TEXT,
  stripe_test_secret_key TEXT,
  stripe_webhook_secret TEXT,
  stripe_live_publishable_key TEXT,
  stripe_live_secret_key TEXT,
  stripe_live_webhook_secret TEXT,
  stripe_mode TEXT CHECK (stripe_mode IN ('test', 'live')),
  workspace_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des pages légales
CREATE TABLE IF NOT EXISTS legal_pages (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des paramètres de cookies
CREATE TABLE IF NOT EXISTS cookie_settings (
  id SERIAL PRIMARY KEY,
  necessary_cookies_text TEXT,
  analytics_cookies_text TEXT,
  marketing_cookies_text TEXT,
  preferences_cookies_text TEXT,
  consent_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des factures
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  amount_ht DECIMAL(10, 2),
  amount_ttc DECIMAL(10, 2),
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'cancelled')),
  issued_date DATE NOT NULL,
  due_date DATE,
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des modèles d'emails
CREATE TABLE IF NOT EXISTS email_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des logs d'emails
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des tickets de support
CREATE TABLE IF NOT EXISTS support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des messages de support
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création de la table des logs d'application
CREATE TABLE IF NOT EXISTS application_logs (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  context JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Création des index pour améliorer les performances

-- Index pour les utilisateurs
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_is_admin_idx ON users(is_admin);

-- Index pour les espaces
CREATE INDEX IF NOT EXISTS spaces_is_active_idx ON spaces(is_active);
CREATE INDEX IF NOT EXISTS spaces_pricing_type_idx ON spaces(pricing_type);

-- Index pour les réservations
CREATE INDEX IF NOT EXISTS bookings_user_id_idx ON bookings(user_id);
CREATE INDEX IF NOT EXISTS bookings_space_id_idx ON bookings(space_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);
CREATE INDEX IF NOT EXISTS bookings_start_time_idx ON bookings(start_time);
CREATE INDEX IF NOT EXISTS bookings_end_time_idx ON bookings(end_time);

-- Index pour les créneaux horaires
CREATE INDEX IF NOT EXISTS time_slots_space_id_idx ON time_slots(space_id);
CREATE INDEX IF NOT EXISTS time_slots_day_of_week_idx ON time_slots(day_of_week);

-- Index pour les pages légales
CREATE INDEX IF NOT EXISTS legal_pages_slug_idx ON legal_pages(slug);
CREATE INDEX IF NOT EXISTS legal_pages_is_published_idx ON legal_pages(is_published);

-- Index pour les factures
CREATE INDEX IF NOT EXISTS invoices_booking_id_idx ON invoices(booking_id);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);

-- Index pour les tickets de support
CREATE INDEX IF NOT EXISTS support_tickets_user_id_idx ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status);
CREATE INDEX IF NOT EXISTS support_tickets_priority_idx ON support_tickets(priority);

-- Index pour les messages de support
CREATE INDEX IF NOT EXISTS support_messages_ticket_id_idx ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS support_messages_user_id_idx ON support_messages(user_id);

-- Index pour les logs d'application
CREATE INDEX IF NOT EXISTS application_logs_level_idx ON application_logs(level);
CREATE INDEX IF NOT EXISTS application_logs_timestamp_idx ON application_logs(timestamp);

-- Insertion des données initiales

-- Insertion d'un utilisateur administrateur par défaut
INSERT INTO users (first_name, last_name, email, is_admin)
VALUES ('Admin', 'Système', 'admin@coworkmy.com', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insertion des paramètres d'administration par défaut
INSERT INTO admin_settings (site_name, contact_email, stripe_mode)
VALUES ('CoWorkMy', 'contact@coworkmy.com', 'test')
ON CONFLICT DO NOTHING;

-- Insertion des pages légales par défaut
INSERT INTO legal_pages (slug, title, content, is_published)
VALUES 
  ('mentions-legales', 'Mentions Légales', 'Contenu des mentions légales...', TRUE),
  ('politique-de-confidentialite', 'Politique de Confidentialité', 'Contenu de la politique de confidentialité...', TRUE),
  ('cgv', 'Conditions Générales de Vente', 'Contenu des CGV...', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insertion des paramètres de cookies par défaut
INSERT INTO cookie_settings (necessary_cookies_text, analytics_cookies_text, marketing_cookies_text, preferences_cookies_text, consent_text)
VALUES (
  'Ces cookies sont nécessaires au fonctionnement du site et ne peuvent pas être désactivés.',
  'Ces cookies nous permettent d''analyser l''utilisation du site pour en mesurer et améliorer les performances.',
  'Ces cookies sont utilisés pour vous proposer des publicités pertinentes.',
  'Ces cookies permettent de personnaliser votre expérience sur le site.',
  'Nous utilisons des cookies pour améliorer votre expérience sur notre site.'
)
ON CONFLICT DO NOTHING;

-- Insertion des modèles d'emails par défaut
INSERT INTO email_templates (name, subject, content, is_active)
VALUES 
  ('confirmation', 'Confirmation de réservation - CoWorkMy', 'Bonjour {first_name},\n\nVotre réservation pour {space_name} du {start_date} au {end_date} a été confirmée.\n\nCordialement,\nL''équipe CoWorkMy', TRUE),
  ('annulation', 'Annulation de réservation - CoWorkMy', 'Bonjour {first_name},\n\nVotre réservation pour {space_name} du {start_date} au {end_date} a été annulée.\n\nCordialement,\nL''équipe CoWorkMy', TRUE),
  ('bienvenue', 'Bienvenue chez CoWorkMy', 'Bonjour {first_name},\n\nNous vous souhaitons la bienvenue chez CoWorkMy.\n\nCordialement,\nL''équipe CoWorkMy', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Fonction pour mettre à jour automatiquement le champ updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création des triggers pour mettre à jour automatiquement le champ updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_pages_updated_at BEFORE UPDATE ON legal_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cookie_settings_updated_at BEFORE UPDATE ON cookie_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour vérifier si un utilisateur est administrateur
CREATE OR REPLACE FUNCTION is_admin(user_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin_user BOOLEAN;
BEGIN
  SELECT u.is_admin INTO is_admin_user FROM users u WHERE u.id = user_id;
  RETURN COALESCE(is_admin_user, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les créneaux horaires disponibles pour un espace à une date donnée
CREATE OR REPLACE FUNCTION get_available_time_slots(space_id INTEGER, date DATE)
RETURNS TABLE (
  id INTEGER,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_available BOOLEAN
) AS $$
DECLARE
  day_of_week INTEGER;
BEGIN
  -- Déterminer le jour de la semaine (0 = dimanche, 1 = lundi, etc.)
  day_of_week := EXTRACT(DOW FROM date);
  
  -- Récupérer les créneaux horaires pour ce jour de la semaine
  RETURN QUERY
  SELECT 
    ts.id,
    (date + ts.start_time::time)::TIMESTAMPTZ AS start_time,
    (date + ts.end_time::time)::TIMESTAMPTZ AS end_time,
    ts.is_available AND NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.space_id = ts.space_id
      AND b.status != 'cancelled'
      AND (
        (b.start_time <= (date + ts.start_time::time)::TIMESTAMPTZ AND b.end_time > (date + ts.start_time::time)::TIMESTAMPTZ) OR
        (b.start_time < (date + ts.end_time::time)::TIMESTAMPTZ AND b.end_time >= (date + ts.end_time::time)::TIMESTAMPTZ) OR
        (b.start_time >= (date + ts.start_time::time)::TIMESTAMPTZ AND b.end_time <= (date + ts.end_time::time)::TIMESTAMPTZ)
      )
    ) AS is_available
  FROM time_slots ts
  WHERE ts.space_id = get_available_time_slots.space_id
  AND ts.day_of_week = day_of_week
  ORDER BY ts.start_time;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les espaces populaires
CREATE OR REPLACE FUNCTION get_popular_spaces(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  id INTEGER,
  name TEXT,
  description TEXT,
  capacity INTEGER,
  price_per_hour DECIMAL,
  price_per_day DECIMAL,
  price_per_month DECIMAL,
  price_per_half_day DECIMAL,
  price_per_quarter_day DECIMAL,
  pricing_type TEXT,
  is_active BOOLEAN,
  booking_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.name,
    s.description,
    s.capacity,
    s.price_per_hour,
    s.price_per_day,
    s.price_per_month,
    s.price_per_half_day,
    s.price_per_quarter_day,
    s.pricing_type,
    s.is_active,
    COUNT(b.id) AS booking_count
  FROM spaces s
  LEFT JOIN bookings b ON s.id = b.space_id AND b.status != 'cancelled'
  WHERE s.is_active = TRUE
  GROUP BY s.id
  ORDER BY booking_count DESC, s.name
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les réservations d'un utilisateur
CREATE OR REPLACE FUNCTION get_bookings(user_id INTEGER, status TEXT DEFAULT NULL, limit_count INTEGER DEFAULT 10, offset_count INTEGER DEFAULT 0)
RETURNS TABLE (
  id INTEGER,
  user_id INTEGER,
  space_id INTEGER,
  space_name TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT,
  total_price DECIMAL,
  total_price_ht DECIMAL,
  total_price_ttc DECIMAL,
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.space_id,
    s.name AS space_name,
    b.start_time,
    b.end_time,
    b.status,
    b.total_price,
    b.total_price_ht,
    b.total_price_ttc,
    b.payment_intent_id,
    b.created_at
  FROM bookings b
  JOIN spaces s ON b.space_id = s.id
  WHERE b.user_id = get_bookings.user_id
  AND (get_bookings.status IS NULL OR b.status = get_bookings.status)
  ORDER BY b.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
