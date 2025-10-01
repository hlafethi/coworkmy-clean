-- Script d'initialisation de la base de données CoworkMy
-- À exécuter sur votre serveur PostgreSQL VPS

-- Création de la base de données (si elle n'existe pas)
-- CREATE DATABASE coworkmy;

-- Connexion à la base de données
-- \c coworkmy;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des espaces
CREATE TABLE IF NOT EXISTS spaces (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_per_hour DECIMAL(10,2),
    capacity INTEGER DEFAULT 1,
    amenities TEXT[],
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des réservations
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    space_id INTEGER REFERENCES spaces(id) ON DELETE CASCADE,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des paramètres homepage
CREATE TABLE IF NOT EXISTS homepage_settings (
    id SERIAL PRIMARY KEY,
    hero_title VARCHAR(255),
    hero_subtitle TEXT,
    hero_background_image VARCHAR(500),
    about_title VARCHAR(255),
    about_description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des images carrousel
CREATE TABLE IF NOT EXISTS carousel_images (
    id SERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des tickets de support
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    user_email VARCHAR(255),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des réponses aux tickets
CREATE TABLE IF NOT EXISTS support_ticket_responses (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES support_tickets(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_admin_response BOOLEAN DEFAULT FALSE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table des paramètres admin
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertion des données par défaut

-- Utilisateur admin par défaut
INSERT INTO users (email, password_hash, full_name, is_admin) 
VALUES ('admin@coworkmy.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrateur', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Espaces par défaut
INSERT INTO spaces (name, description, price_per_hour, capacity, amenities, image_url) VALUES
('Bureau individuel', 'Un espace de travail calme et privé', 15.00, 1, ARRAY['WiFi', 'Électricité', 'Climatisation'], 'https://images.unsplash.com/photo-1497366216548-37526070297c'),
('Salle de réunion', 'Parfaite pour vos réunions d''équipe', 25.00, 8, ARRAY['WiFi', 'Écran', 'Tableau blanc', 'Climatisation'], 'https://images.unsplash.com/photo-1497366754035-f200968a6e72'),
('Espace ouvert', 'Zone de coworking partagée', 10.00, 20, ARRAY['WiFi', 'Électricité', 'Climatisation', 'Café'], 'https://images.unsplash.com/photo-1497366811353-6870744d04b2')
ON CONFLICT DO NOTHING;

-- Paramètres homepage par défaut
INSERT INTO homepage_settings (hero_title, hero_subtitle, hero_background_image, about_title, about_description, contact_email, contact_phone) VALUES
('Bienvenue chez CoworkMy', 'Votre espace de coworking moderne', 'https://images.unsplash.com/photo-1600508774635-0b9a8c7b8b8b', 'À propos de nous', 'Découvrez nos espaces de coworking', 'contact@coworkmy.fr', '+33 1 23 45 67 89')
ON CONFLICT DO NOTHING;

-- Images carrousel par défaut
INSERT INTO carousel_images (image_url, title, description, order_index) VALUES
('https://images.unsplash.com/photo-1497366216548-37526070297c', 'Espace de travail moderne', 'Un environnement propice à la productivité', 1),
('https://images.unsplash.com/photo-1497366754035-f200968a6e72', 'Salle de réunion', 'Idéale pour vos réunions d''équipe', 2),
('https://images.unsplash.com/photo-1497366811353-6870744d04b2', 'Zone de détente', 'Un espace pour vous détendre entre les tâches', 3)
ON CONFLICT DO NOTHING;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_spaces_active ON spaces(is_active);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_space ON bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spaces_updated_at BEFORE UPDATE ON spaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_homepage_settings_updated_at BEFORE UPDATE ON homepage_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Affichage des tables créées
SELECT 'Base de données CoworkMy initialisée avec succès!' as message;
