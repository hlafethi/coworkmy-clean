-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS google_business_config CASCADE;

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create admin_settings table
CREATE TABLE admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create google_business_config table
CREATE TABLE google_business_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    place_id TEXT UNIQUE,
    api_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_business_config ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by users who created them"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- Admin settings policies
CREATE POLICY "Admin settings are viewable by authenticated users"
    ON admin_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admin settings are editable by admin users"
    ON admin_settings FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Google business config policies
CREATE POLICY "Google config is viewable by authenticated users"
    ON google_business_config FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Google config is editable by admin users"
    ON google_business_config FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default admin settings
INSERT INTO admin_settings (key, value)
VALUES 
    ('site_name', '"Canard Cowork Space"'),
    ('site_description', '"Votre espace de coworking à Paris"'),
    ('contact_email', '"contact@canard-cowork.space"')
ON CONFLICT (key) DO NOTHING; 