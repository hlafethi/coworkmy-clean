-- Activer l'authentification par email
ALTER SYSTEM SET auth.email.enable_signup = true;
ALTER SYSTEM SET auth.email.enable_confirmations = false;
ALTER SYSTEM SET auth.email.enable_notifications = false;

-- Configurer les paramètres de sécurité
ALTER SYSTEM SET auth.jwt_exp = 3600;
ALTER SYSTEM SET auth.refresh_token_exp = 604800; 