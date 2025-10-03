-- Script d'initialisation de la base de données CoworkMy
-- Ce script sera exécuté automatiquement lors du premier démarrage de PostgreSQL

-- Créer la base de données si elle n'existe pas
CREATE DATABASE coworkmy;

-- Se connecter à la base de données
\c coworkmy;

-- Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    avatar_url TEXT,
    logo_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des espaces
CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    capacity INTEGER NOT NULL,
    amenities TEXT[],
    images TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des réservations
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    payment_intent_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des créneaux horaires
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des documents utilisateur
CREATE TABLE IF NOT EXISTS profile_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    document_type VARCHAR(100),
    upload_date TIMESTAMP DEFAULT NOW()
);

-- Table des paramètres admin
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des tickets de support
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des réponses aux tickets
CREATE TABLE IF NOT EXISTS support_ticket_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_response BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des templates email
CREATE TABLE IF NOT EXISTS email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des pages légales
CREATE TABLE IF NOT EXISTS legal_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des images carousel
CREATE TABLE IF NOT EXISTS carousel_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table de configuration email
CREATE TABLE IF NOT EXISTS email_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER NOT NULL,
    smtp_username VARCHAR(255) NOT NULL,
    smtp_secure BOOLEAN DEFAULT FALSE,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255),
    reply_to_email VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table FAQ
CREATE TABLE IF NOT EXISTS support_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category VARCHAR(100),
    order_index INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table base de connaissances
CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insérer un utilisateur admin par défaut
INSERT INTO profiles (email, password_hash, full_name, is_admin) 
VALUES ('admin@coworkmy.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrateur', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insérer des espaces par défaut
INSERT INTO spaces (name, description, price, capacity, amenities, is_active) VALUES
('Bureau Privé', 'Bureau individuel avec vue sur la ville', 25.00, 1, ARRAY['WiFi', 'Climatisation', 'Bureau', 'Chaise ergonomique'], TRUE),
('Salle de Réunion', 'Salle de réunion pour 6 personnes', 15.00, 6, ARRAY['WiFi', 'Projecteur', 'Tableau blanc', 'Climatisation'], TRUE),
('Espace Open Space', 'Espace de coworking partagé', 8.00, 20, ARRAY['WiFi', 'Climatisation', 'Café', 'Imprimante'], TRUE)
ON CONFLICT DO NOTHING;

-- Insérer des créneaux horaires par défaut
INSERT INTO time_slots (space_id, day_of_week, start_time, end_time, is_available) 
SELECT s.id, d.day, '09:00'::TIME, '18:00'::TIME, TRUE
FROM spaces s, generate_series(0, 6) AS d(day)
WHERE s.is_active = TRUE
ON CONFLICT DO NOTHING;

-- Insérer des templates email par défaut
INSERT INTO email_templates (name, subject, content, is_active) VALUES
('welcome', 'Bienvenue sur CoworkMy', 'Bonjour {{name}}, bienvenue sur CoworkMy !', TRUE),
('booking_confirmation', 'Confirmation de réservation', 'Votre réservation a été confirmée pour {{space_name}} du {{start_date}} au {{end_date}}.', TRUE),
('booking_cancellation', 'Annulation de réservation', 'Votre réservation pour {{space_name}} a été annulée.', TRUE)
ON CONFLICT DO NOTHING;

-- Insérer des pages légales par défaut
INSERT INTO legal_pages (title, slug, content, is_published) VALUES
('Mentions Légales', 'mentions-legales', 'Mentions légales de CoworkMy...', TRUE),
('Conditions Générales d''Utilisation', 'cgu', 'Conditions générales d''utilisation...', TRUE),
('Politique de Confidentialité', 'confidentialite', 'Politique de confidentialité...', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Insérer des FAQ par défaut
INSERT INTO support_faqs (question, answer, category, order_index, is_published) VALUES
('Comment réserver un espace ?', 'Vous pouvez réserver un espace directement depuis notre site web en sélectionnant la date et l''heure souhaitées.', 'Réservation', 1, TRUE),
('Quels sont les moyens de paiement acceptés ?', 'Nous acceptons les cartes bancaires via Stripe.', 'Paiement', 2, TRUE),
('Puis-je annuler ma réservation ?', 'Oui, vous pouvez annuler votre réservation jusqu''à 24h avant la date prévue.', 'Annulation', 3, TRUE)
ON CONFLICT DO NOTHING;

-- Créer les index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_space_id ON bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_spaces_active ON spaces(is_active);
CREATE INDEX IF NOT EXISTS idx_time_slots_space_id ON time_slots(space_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Créer les triggers pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_pages_updated_at BEFORE UPDATE ON legal_pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_faqs_updated_at BEFORE UPDATE ON support_faqs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_base_updated_at BEFORE UPDATE ON knowledge_base FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_email_config_updated_at BEFORE UPDATE ON email_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
