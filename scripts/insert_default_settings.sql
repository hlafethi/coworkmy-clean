-- Script pour insérer les paramètres par défaut dans admin_settings
-- Structure: key (TEXT), value (JSONB)

-- Paramètres de la page d'accueil
INSERT INTO admin_settings (key, value) 
VALUES (
  'homepage',
  '{
    "title": "Canard Cowork Space",
    "description": "Votre espace de coworking à Paris",
    "hero_title": "Votre espace de travail idéal à Paris",
    "hero_subtitle": "Des espaces de coworking modernes et inspirants pour les freelances, entrepreneurs et équipes qui veulent travailler dans un environnement stimulant et connecté.",
    "hero_background_image": "https://images.unsplash.com/photo-1600508774634-4e11d34730e2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
    "cta_text": "Commencer",
    "features_title": "Pourquoi choisir Canard Cowork Space ?",
    "features_subtitle": "Nous offrons bien plus qu''un simple espace de travail. Découvrez nos avantages exclusifs qui font de nous le choix idéal pour les professionnels exigeants.",
    "cta_section_title": "Prêt à rejoindre notre communauté ?",
    "cta_section_subtitle": "Inscrivez-vous dès aujourd''hui et commencez à profiter de tous les avantages",
    "cta_secondary_button_text": "Réserver une visite",
    "is_published": true
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Paramètres Stripe
INSERT INTO admin_settings (key, value) 
VALUES (
  'stripe',
  '{
    "mode": "test",
    "test_publishable_key": "",
    "test_secret_key": "",
    "webhook_secret": "",
    "live_publishable_key": "",
    "live_secret_key": "",
    "live_webhook_secret": ""
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Paramètres Google Reviews
INSERT INTO admin_settings (key, value) 
VALUES (
  'google_reviews',
  '{
    "api_key": "",
    "place_id": "",
    "max_reviews": 10,
    "min_rating": 4
  }'::jsonb
)
ON CONFLICT (key) DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = NOW();

-- Vérification des insertions
SELECT key, value FROM admin_settings ORDER BY key; 