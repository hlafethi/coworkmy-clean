-- Migration O2Switch - Version ultra-basique pour phpPgAdmin
-- Compatible avec toutes les versions PostgreSQL

-- 1. Table profiles
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Table spaces
CREATE TABLE IF NOT EXISTS spaces (
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

-- 3. Table bookings
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES profiles(id) ON DELETE CASCADE,
    space_id VARCHAR(36) REFERENCES spaces(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Table payments
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    booking_id VARCHAR(36) REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    mode VARCHAR(10) DEFAULT 'test' CHECK (mode IN ('test', 'live')),
    user_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 5. Table admin_settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 6. Table time_slots
CREATE TABLE IF NOT EXISTS time_slots (
    id VARCHAR(36) PRIMARY KEY,
    space_id VARCHAR(36) REFERENCES spaces(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 7. Table support_messages
CREATE TABLE IF NOT EXISTS support_messages (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Table support_chat_sessions
CREATE TABLE IF NOT EXISTS support_chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 9. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_space_id ON bookings(space_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_end_time ON bookings(end_time);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session_id ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_email ON payments(user_email);
CREATE INDEX IF NOT EXISTS idx_time_slots_space_id ON time_slots(space_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_support_chat_sessions_user_id ON support_chat_sessions(user_id);

-- 10. Données de base
INSERT INTO admin_settings (id, key, value) VALUES 
('1', 'stripe', '{"mode": "test", "test_secret_key": "", "test_publishable_key": "", "live_secret_key": "", "live_publishable_key": ""}'),
('2', 'email', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": "", "from_email": ""}'),
('3', 'general', '{"site_name": "Canard Cowork Space", "contact_email": "contact@canard-cowork.space"}')
ON CONFLICT (key) DO NOTHING;

-- 11. Utilisateur admin par défaut
INSERT INTO profiles (id, email, full_name, role) VALUES 
('1', 'admin@canard-cowork.space', 'Administrateur', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 12. Espaces de test
INSERT INTO spaces (id, name, description, capacity, price_per_hour) VALUES 
('1', 'Bureau Privé 1', 'Bureau privé avec vue sur la ville', 1, 15.00),
('2', 'Salle de Réunion A', 'Salle de réunion pour 6 personnes', 6, 25.00),
('3', 'Espace Coworking', 'Espace de travail partagé', 10, 8.00)
ON CONFLICT (id) DO NOTHING;

-- 13. Vues utiles
CREATE OR REPLACE VIEW booking_summary AS
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

-- 14. Contraintes de validation
ALTER TABLE bookings ADD CONSTRAINT check_booking_duration 
    CHECK (end_time > start_time);

-- Fin de la migration
SELECT 'Migration O2Switch terminée avec succès !' as message; 