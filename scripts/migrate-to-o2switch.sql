-- Migration de Supabase vers O2Switch PostgreSQL
-- Script complet pour créer toutes les tables, RLS, et fonctions

-- 1. Créer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Créer les types ENUM
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded');
CREATE TYPE stripe_mode AS ENUM ('test', 'live');

-- 3. Créer la table profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(20),
    company VARCHAR(255),
    role user_role DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer la table spaces
CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Créer la table bookings
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    status booking_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Créer la table payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    stripe_session_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status payment_status DEFAULT 'pending',
    mode stripe_mode DEFAULT 'test',
    user_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Créer la table admin_settings
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Créer la table time_slots
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    space_id UUID REFERENCES spaces(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Créer la table support_messages
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Créer la table support_chat_sessions
CREATE TABLE IF NOT EXISTS support_chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Créer les index pour les performances
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

-- 12. Créer les triggers pour updated_at
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
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON admin_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_messages_updated_at BEFORE UPDATE ON support_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_support_chat_sessions_updated_at BEFORE UPDATE ON support_chat_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 13. Insérer les données de base
INSERT INTO admin_settings (key, value) VALUES 
('stripe', '{"mode": "test", "test_secret_key": "", "test_publishable_key": "", "live_secret_key": "", "live_publishable_key": ""}'),
('email', '{"smtp_host": "", "smtp_port": 587, "smtp_user": "", "smtp_pass": "", "from_email": ""}'),
('general', '{"site_name": "Canard Cowork Space", "contact_email": "contact@canard-cowork.space"}')
ON CONFLICT (key) DO NOTHING;

-- 14. Créer un utilisateur admin par défaut
INSERT INTO profiles (email, full_name, role) VALUES 
('admin@canard-cowork.space', 'Administrateur', 'admin')
ON CONFLICT (email) DO NOTHING;

-- 15. Créer quelques espaces de test
INSERT INTO spaces (name, description, capacity, price_per_hour) VALUES 
('Bureau Privé 1', 'Bureau privé avec vue sur la ville', 1, 15.00),
('Salle de Réunion A', 'Salle de réunion pour 6 personnes', 6, 25.00),
('Espace Coworking', 'Espace de travail partagé', 10, 8.00)
ON CONFLICT DO NOTHING;

-- 16. Créer les politiques RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques pour spaces
CREATE POLICY "Anyone can view active spaces" ON spaces FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage spaces" ON spaces FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques pour bookings
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create their own bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Admins can view all bookings" ON bookings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques pour payments
CREATE POLICY "Users can view their own payments" ON payments FOR SELECT USING (user_email = (SELECT email FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Admins can view all payments" ON payments FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques pour admin_settings
CREATE POLICY "Admins can manage settings" ON admin_settings FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques pour time_slots
CREATE POLICY "Anyone can view time slots" ON time_slots FOR SELECT USING (true);
CREATE POLICY "Admins can manage time slots" ON time_slots FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques pour support_messages
CREATE POLICY "Users can view their own messages" ON support_messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create messages" ON support_messages FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all messages" ON support_messages FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Politiques pour support_chat_sessions
CREATE POLICY "Users can view their own sessions" ON support_chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create sessions" ON support_chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can view all sessions" ON support_chat_sessions FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 17. Créer les fonctions utilitaires
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Créer les vues utiles
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

-- 19. Créer les contraintes de validation
ALTER TABLE bookings ADD CONSTRAINT check_booking_duration 
    CHECK (end_time > start_time);

ALTER TABLE bookings ADD CONSTRAINT check_booking_overlap 
    EXCLUDE USING gist (
        space_id WITH =,
        tsrange(start_time, end_time) WITH &&
    );

-- 20. Créer les fonctions de notification (pour les webhooks Stripe)
CREATE OR REPLACE FUNCTION notify_payment_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Ici on peut ajouter la logique pour les webhooks Stripe
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_update_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION notify_payment_update();

-- Fin de la migration
COMMENT ON DATABASE sc2rafi0640_coworkmy IS 'Base de données Canard Cowork Space - Migrée depuis Supabase'; 