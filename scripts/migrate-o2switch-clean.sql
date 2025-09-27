-- Migration O2Switch - Nettoyage et création
-- Compatible PostgreSQL 9.6.22

-- 1. Suppression des tables existantes (si elles existent)
DROP TABLE IF EXISTS support_chat_sessions CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Suppression des vues existantes
DROP VIEW IF EXISTS booking_summary CASCADE;

-- 3. Création des tables
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    role VARCHAR(10) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE spaces (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES profiles(id) ON DELETE CASCADE,
    space_id VARCHAR(36) REFERENCES spaces(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending',
    mode VARCHAR(10) DEFAULT 'test',
    user_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE admin_settings (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE time_slots (
    id VARCHAR(36) PRIMARY KEY,
    space_id VARCHAR(36) REFERENCES spaces(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE support_messages (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE support_chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Création des index
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_space_id ON bookings(space_id);
CREATE INDEX idx_bookings_start_time ON bookings(start_time);
CREATE INDEX idx_bookings_end_time ON bookings(end_time);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_stripe_session_id ON payments(stripe_session_id);
CREATE INDEX idx_payments_user_email ON payments(user_email);
CREATE INDEX idx_time_slots_space_id ON time_slots(space_id);
CREATE INDEX idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX idx_support_chat_sessions_user_id ON support_chat_sessions(user_id);

-- 5. Insertion des données de base
INSERT INTO admin_settings (id, key, value) VALUES ('1', 'stripe', '{"mode": "test", "test_secret_key": "", "test_publishable_key": "", "live_secret_key": "", "live_publishable_key": ""}');

INSERT INTO admin_settings (id, key, value) VALUES ('2', 'email', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": "", "from_email": ""}');

INSERT INTO admin_settings (id, key, value) VALUES ('3', 'general', '{"site_name": "Canard Cowork Space", "contact_email": "contact@canard-cowork.space"}');

INSERT INTO profiles (id, email, full_name, role) VALUES ('1', 'admin@canard-cowork.space', 'Administrateur', 'admin');

INSERT INTO spaces (id, name, description, capacity, price_per_hour) VALUES ('1', 'Bureau Privé 1', 'Bureau privé avec vue sur la ville', 1, 15.00);

INSERT INTO spaces (id, name, description, capacity, price_per_hour) VALUES ('2', 'Salle de Réunion A', 'Salle de réunion pour 6 personnes', 6, 25.00);

INSERT INTO spaces (id, name, description, capacity, price_per_hour) VALUES ('3', 'Espace Coworking', 'Espace de travail partagé', 10, 8.00);

-- 6. Création de la vue
CREATE VIEW booking_summary AS
SELECT 
    b.id,
    b.user_id,
    p.full_name as user_name,
    p.email as user_email,
    s.name as space_name,
    b.start_time,
    b.end_time,
    b.total_price,
    b.status,
    b.created_at
FROM bookings b
JOIN profiles p ON b.user_id = p.id
JOIN spaces s ON b.space_id = s.id;

-- 7. Message de succès
SELECT 'Migration O2Switch terminée avec succès !' as message; 