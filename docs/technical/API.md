# Documentation de l'API

## Supabase

### Tables principales

#### profiles
- `id` (UUID, PK) : ID de l'utilisateur (lié à auth.users)
- `first_name` (TEXT) : Prénom
- `last_name` (TEXT) : Nom
- `email` (TEXT) : Email
- `phone` (TEXT) : Numéro de téléphone
- `is_admin` (BOOLEAN) : Indique si l'utilisateur est administrateur

#### spaces
- `id` (UUID, PK) : ID de l'espace
- `name` (TEXT) : Nom de l'espace
- `description` (TEXT) : Description
- `capacity` (INT) : Capacité
- `price_per_hour` (DECIMAL) : Prix par heure
- `price_per_day` (DECIMAL) : Prix par jour
- `price_per_month` (DECIMAL) : Prix par mois
- `price_per_half_day` (DECIMAL) : Prix par demi-journée
- `price_per_quarter_day` (DECIMAL) : Prix par quart de journée
- `pricing_type` (TEXT) : Type de tarification (hourly, daily, monthly)
- `is_active` (BOOLEAN) : Indique si l'espace est actif

#### bookings
- `id` (UUID, PK) : ID de la réservation
- `user_id` (UUID, FK) : ID de l'utilisateur
- `space_id` (UUID, FK) : ID de l'espace
- `start_time` (TIMESTAMPTZ) : Date et heure de début
- `end_time` (TIMESTAMPTZ) : Date et heure de fin
- `status` (TEXT) : Statut (pending, confirmed, cancelled)
- `total_price` (DECIMAL) : Prix total
- `total_price_ht` (DECIMAL) : Prix total HT
- `total_price_ttc` (DECIMAL) : Prix total TTC
- `payment_intent_id` (TEXT) : ID de l'intention de paiement Stripe

#### time_slots
- `id` (UUID, PK) : ID du créneau horaire
- `space_id` (UUID, FK) : ID de l'espace
- `day_of_week` (INT) : Jour de la semaine (0-6, 0 = dimanche)
- `start_time` (TIME) : Heure de début
- `end_time` (TIME) : Heure de fin
- `is_available` (BOOLEAN) : Indique si le créneau est disponible

#### admin_settings
- `id` (UUID, PK) : ID des paramètres
- `site_name` (TEXT) : Nom du site
- `contact_email` (TEXT) : Email de contact
- `phone_number` (TEXT) : Numéro de téléphone
- `hero_title` (TEXT) : Titre de la section héro
- `hero_subtitle` (TEXT) : Sous-titre de la section héro
- `cta_text` (TEXT) : Texte du bouton d'appel à l'action
- `features_title` (TEXT) : Titre de la section fonctionnalités
- `features_subtitle` (TEXT) : Sous-titre de la section fonctionnalités
- `stripe_test_publishable_key` (TEXT) : Clé publique Stripe en mode test
- `stripe_test_secret_key` (TEXT) : Clé secrète Stripe en mode test
- `stripe_webhook_secret` (TEXT) : Secret du webhook Stripe
- `stripe_live_publishable_key` (TEXT) : Clé publique Stripe en mode production
- `stripe_live_secret_key` (TEXT) : Clé secrète Stripe en mode production
- `stripe_live_webhook_secret` (TEXT) : Secret du webhook Stripe en mode production
- `stripe_mode` (TEXT) : Mode Stripe (test, live)
- `workspace_title` (TEXT) : Titre de l'espace de travail

#### legal_pages
- `id` (UUID, PK) : ID de la page
- `slug` (TEXT) : Slug de la page
- `title` (TEXT) : Titre de la page
- `content` (TEXT) : Contenu de la page
- `is_published` (BOOLEAN) : Indique si la page est publiée
- `updated_at` (TIMESTAMPTZ) : Date de dernière mise à jour

#### cookie_settings
- `id` (UUID, PK) : ID des paramètres
- `necessary_cookies_text` (TEXT) : Texte pour les cookies nécessaires
- `analytics_cookies_text` (TEXT) : Texte pour les cookies d'analyse
- `marketing_cookies_text` (TEXT) : Texte pour les cookies marketing
- `preferences_cookies_text` (TEXT) : Texte pour les cookies de préférences
- `consent_text` (TEXT) : Texte de consentement
- `updated_at` (TIMESTAMPTZ) : Date de dernière mise à jour

#### invoices
- `id` (UUID, PK) : ID de la facture
- `booking_id` (UUID, FK) : ID de la réservation
- `user_id` (UUID, FK) : ID de l'utilisateur
- `invoice_number` (TEXT) : Numéro de facture
- `amount` (DECIMAL) : Montant
- `amount_ht` (DECIMAL) : Montant HT
- `amount_ttc` (DECIMAL) : Montant TTC
- `status` (TEXT) : Statut (paid, pending, cancelled)
- `issued_date` (DATE) : Date d'émission
- `due_date` (DATE) : Date d'échéance
- `paid_date` (DATE) : Date de paiement

#### email_templates
- `id` (UUID, PK) : ID du modèle
- `name` (TEXT) : Nom du modèle
- `subject` (TEXT) : Sujet de l'email
- `content` (TEXT) : Contenu de l'email
- `is_active` (BOOLEAN) : Indique si le modèle est actif

#### email_logs
- `id` (UUID, PK) : ID du log
- `recipient` (TEXT) : Destinataire
- `subject` (TEXT) : Sujet
- `content` (TEXT) : Contenu
- `status` (TEXT) : Statut (sent, failed)
- `error` (TEXT) : Message d'erreur
- `sent_at` (TIMESTAMPTZ) : Date d'envoi

#### support_tickets
- `id` (UUID, PK) : ID du ticket
- `user_id` (UUID, FK) : ID de l'utilisateur
- `subject` (TEXT) : Sujet
- `description` (TEXT) : Description
- `status` (TEXT) : Statut (open, in_progress, resolved, closed)
- `priority` (TEXT) : Priorité (low, medium, high, urgent)
- `created_at` (TIMESTAMPTZ) : Date de création
- `updated_at` (TIMESTAMPTZ) : Date de mise à jour

#### support_messages
- `id` (UUID, PK) : ID du message
- `ticket_id` (UUID, FK) : ID du ticket
- `user_id` (UUID, FK) : ID de l'utilisateur
- `message` (TEXT) : Message
- `is_staff` (BOOLEAN) : Indique si le message provient du staff
- `created_at` (TIMESTAMPTZ) : Date de création

#### application_logs
- `id` (UUID, PK) : ID du log
- `level` (TEXT) : Niveau (debug, info, warn, error)
- `message` (TEXT) : Message
- `context` (JSONB) : Contexte
- `timestamp` (TIMESTAMPTZ) : Horodatage
- `created_at` (TIMESTAMPTZ) : Date de création

### Fonctions RPC

#### is_admin_v2(target_user_id UUID)
Vérifie si un utilisateur est administrateur.

#### get_available_time_slots(space_id UUID, date DATE)
Récupère les créneaux horaires disponibles pour un espace à une date donnée.

#### create_booking(user_id UUID, space_id UUID, start_time TIMESTAMPTZ, end_time TIMESTAMPTZ)
Crée une nouvelle réservation.

#### get_popular_spaces(limit INT)
Récupère les espaces les plus populaires.

#### get_bookings(user_id UUID, status TEXT, limit INT, offset INT)
Récupère les réservations d'un utilisateur.

#### make_admin(target_user_id UUID)
Donne le rôle d'administrateur à un utilisateur.

### Edge Functions

#### create-payment-session
Crée une session de paiement Stripe.

#### get-google-reviews
Récupère les avis Google.

#### initialize-database
Initialise la base de données.

#### send-email
Envoie un email.

#### stripe-webhook
Gère les webhooks Stripe.

#### log-collector
Collecte les logs de l'application.

## Hooks React

### useAuth
Gère l'authentification de l'utilisateur.

### useAdminSettings
Gère les paramètres d'administration.

### useSpaces
Gère les espaces de coworking.

### useBookingForm
Gère le formulaire de réservation.

### useTimeSlots
Gère les créneaux horaires.

### useDashboard
Gère le tableau de bord de l'utilisateur.

### useGoogleReviews
Gère les avis Google.

### useLogger
Gère les logs de l'application.
