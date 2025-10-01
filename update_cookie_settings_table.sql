-- Script pour mettre à jour la table cookie_settings avec tous les nouveaux champs
-- Exécuter ce script dans votre base de données PostgreSQL

-- Ajouter les colonnes manquantes à la table cookie_settings
ALTER TABLE cookie_settings 
ADD COLUMN IF NOT EXISTS title text DEFAULT 'Paramètres de Cookies',
ADD COLUMN IF NOT EXISTS description text DEFAULT 'Gérez vos préférences de cookies',
ADD COLUMN IF NOT EXISTS accept_button_text text DEFAULT 'Accepter',
ADD COLUMN IF NOT EXISTS reject_button_text text DEFAULT 'Refuser',
ADD COLUMN IF NOT EXISTS settings_button_text text DEFAULT 'Personnaliser',
ADD COLUMN IF NOT EXISTS save_preferences_text text DEFAULT 'Enregistrer',
ADD COLUMN IF NOT EXISTS necessary_cookies_title text DEFAULT 'Cookies essentiels',
ADD COLUMN IF NOT EXISTS necessary_cookies_description text DEFAULT 'Ces cookies sont nécessaires au fonctionnement du site.',
ADD COLUMN IF NOT EXISTS analytics_cookies_title text DEFAULT 'Cookies analytiques',
ADD COLUMN IF NOT EXISTS analytics_cookies_description text DEFAULT 'Ces cookies nous aident à améliorer notre site.',
ADD COLUMN IF NOT EXISTS analytics_cookies_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marketing_cookies_title text DEFAULT 'Cookies marketing',
ADD COLUMN IF NOT EXISTS marketing_cookies_description text DEFAULT 'Ces cookies permettent de personnaliser les publicités.',
ADD COLUMN IF NOT EXISTS marketing_cookies_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_url text DEFAULT '/privacy',
ADD COLUMN IF NOT EXISTS cookie_policy_url text DEFAULT '/cookies',
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS banner_position text DEFAULT 'bottom',
ADD COLUMN IF NOT EXISTS banner_layout text DEFAULT 'banner',
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#6B7280',
ADD COLUMN IF NOT EXISTS background_color text DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS text_color text DEFAULT '#1F2937';

-- Mettre à jour les enregistrements existants avec les valeurs par défaut si elles sont NULL
UPDATE cookie_settings 
SET 
  title = COALESCE(title, 'Paramètres de Cookies'),
  description = COALESCE(description, 'Gérez vos préférences de cookies'),
  accept_button_text = COALESCE(accept_button_text, 'Accepter'),
  reject_button_text = COALESCE(reject_button_text, 'Refuser'),
  settings_button_text = COALESCE(settings_button_text, 'Personnaliser'),
  save_preferences_text = COALESCE(save_preferences_text, 'Enregistrer'),
  necessary_cookies_title = COALESCE(necessary_cookies_title, 'Cookies essentiels'),
  necessary_cookies_description = COALESCE(necessary_cookies_description, 'Ces cookies sont nécessaires au fonctionnement du site.'),
  analytics_cookies_title = COALESCE(analytics_cookies_title, 'Cookies analytiques'),
  analytics_cookies_description = COALESCE(analytics_cookies_description, 'Ces cookies nous aident à améliorer notre site.'),
  analytics_cookies_enabled = COALESCE(analytics_cookies_enabled, false),
  marketing_cookies_title = COALESCE(marketing_cookies_title, 'Cookies marketing'),
  marketing_cookies_description = COALESCE(marketing_cookies_description, 'Ces cookies permettent de personnaliser les publicités.'),
  marketing_cookies_enabled = COALESCE(marketing_cookies_enabled, false),
  privacy_policy_url = COALESCE(privacy_policy_url, '/privacy'),
  cookie_policy_url = COALESCE(cookie_policy_url, '/cookies'),
  is_active = COALESCE(is_active, true),
  banner_position = COALESCE(banner_position, 'bottom'),
  banner_layout = COALESCE(banner_layout, 'banner'),
  primary_color = COALESCE(primary_color, '#3B82F6'),
  secondary_color = COALESCE(secondary_color, '#6B7280'),
  background_color = COALESCE(background_color, '#FFFFFF'),
  text_color = COALESCE(text_color, '#1F2937')
WHERE id IS NOT NULL;

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'cookie_settings' 
ORDER BY ordinal_position;
