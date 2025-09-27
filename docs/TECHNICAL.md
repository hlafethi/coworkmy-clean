# Documentation Technique - Canard Coworking Space

## Table des matières

1. [Architecture du système](#architecture-du-système)
2. [Structure du projet](#structure-du-projet)
3. [Base de données](#base-de-données)
4. [Authentification et autorisation](#authentification-et-autorisation)
5. [API et intégrations](#api-et-intégrations)
6. [Composants principaux](#composants-principaux)
7. [Flux de données](#flux-de-données)
8. [Tests](#tests)
9. [Performance](#performance)
10. [Sécurité](#sécurité)

## Architecture du système

### Vue d'ensemble

Canard Coworking Space est une application web moderne construite avec les technologies suivantes :

- **Frontend** : React avec TypeScript, utilisant Vite comme bundler
- **UI** : Tailwind CSS avec shadcn/ui pour les composants
- **Backend** : Supabase (PostgreSQL + API RESTful)
- **Authentification** : Supabase Auth
- **Stockage** : Supabase Storage
- **Fonctions serverless** : Supabase Edge Functions (Deno)
- **Paiements** : Intégration avec Stripe

### Diagramme d'architecture

```
┌─────────────────┐      ┌─────────────────────────────┐
│                 │      │                             │
│  Client (React) │◄────►│  Supabase (Backend as a     │
│                 │      │  Service)                   │
└────────┬────────┘      │                             │
         │               │  ┌─────────────────────┐    │
         │               │  │                     │    │
         │               │  │  PostgreSQL Database│    │
         │               │  │                     │    │
         │               │  └─────────────────────┘    │
         │               │                             │
         │               │  ┌─────────────────────┐    │
         │               │  │                     │    │
         │               │  │  Authentication     │    │
         │               │  │                     │    │
         │               │  └─────────────────────┘    │
         │               │                             │
         │               │  ┌─────────────────────┐    │
         │               │  │                     │    │
         │               │  │  Storage            │    │
         │               │  │                     │    │
         │               │  └─────────────────────┘    │
         │               │                             │
         │               │  ┌─────────────────────┐    │
         │               │  │                     │    │
         │               │  │  Edge Functions     │    │
         │               │  │                     │    │
         │               │  └─────────────────────┘    │
         │               │                             │
         │               └─────────────────────────────┘
         │
         │               ┌─────────────────────────────┐
         │               │                             │
         └──────────────►│  Stripe (Paiements)         │
                         │                             │
                         └─────────────────────────────┘
```

## Structure du projet

Le projet suit une architecture modulaire organisée par fonctionnalités :

```
/
├── public/                  # Fichiers statiques
├── src/
│   ├── components/          # Composants React
│   │   ├── admin/           # Interface d'administration
│   │   ├── auth/            # Composants d'authentification
│   │   ├── booking/         # Système de réservation
│   │   ├── common/          # Composants partagés
│   │   ├── dashboard/       # Tableau de bord utilisateur
│   │   ├── home/            # Page d'accueil
│   │   ├── seo/             # Composants SEO
│   │   └── ui/              # Composants UI réutilisables
│   ├── hooks/               # Hooks React personnalisés
│   ├── integrations/        # Intégrations avec services externes
│   │   └── supabase/        # Client Supabase
│   ├── lib/                 # Bibliothèques et utilitaires
│   ├── pages/               # Pages de l'application
│   └── utils/               # Fonctions utilitaires
├── supabase/
│   ├── functions/           # Fonctions Edge (Deno)
│   └── migrations/          # Migrations de base de données
└── scripts/                 # Scripts utilitaires
```

## Base de données

### Schéma de la base de données

La base de données PostgreSQL comprend les tables principales suivantes :

- **spaces** : Espaces de coworking disponibles
- **bookings** : Réservations des espaces
- **profiles** : Profils utilisateurs
- **profile_documents** : Documents associés aux profils
- **admin_settings** : Paramètres d'administration
- **google_api_settings** : Configuration de l'API Google

### Diagramme entité-relation

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   spaces    │       │  bookings   │       │  profiles   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ name        │       │ user_id     │◄──────┤ user_id     │
│ description │       │ space_id    │◄─┐    │ full_name   │
│ capacity    │       │ start_time  │  │    │ company_name│
│ hourly_price│       │ end_time    │  │    │ phone_number│
│ daily_price │       │ total_price_ht│ │    │ is_admin   │
│ ...         │◄──────┤ total_price_ttc│    │ ...         │
└─────────────┘       │ status      │  │    └──────┬──────┘
                      └─────────────┘  │           │
                                       │           │
                                       │           │
┌─────────────┐                        │    ┌──────▼──────┐
│admin_settings│                        │    │profile_docs │
├─────────────┤                        │    ├─────────────┤
│ id          │                        │    │ id          │
│ site_name   │                        │    │ profile_id  │
│ contact_email│                       │    │ document_type│
│ ...         │                        │    │ document_url│
└─────────────┘                        │    │ verified    │
                                       │    └─────────────┘
                      ┌─────────────┐  │
                      │google_api_  │  │
                      │settings     │  │
                      ├─────────────┤  │
                      │ id          │  │
                      │ place_id    │  │
                      │ min_rating  │  │
                      │ max_reviews │  │
                      └─────────────┘  │
                                       │
                                       │
```

### Politiques de sécurité Row Level Security (RLS)

Supabase utilise les politiques RLS de PostgreSQL pour sécuriser l'accès aux données :

- Les utilisateurs ne peuvent voir que leurs propres réservations
- Les administrateurs ont accès à toutes les données
- Les espaces sont visibles par tous les utilisateurs authentifiés
- Les profils ne sont modifiables que par leur propriétaire ou un administrateur

## Authentification et autorisation

### Flux d'authentification

1. L'utilisateur s'inscrit ou se connecte via Supabase Auth
2. Un profil est automatiquement créé lors de l'inscription
3. Les jetons JWT sont utilisés pour maintenir la session
4. Les rôles (utilisateur/administrateur) sont stockés dans les métadonnées utilisateur

### Contrôle d'accès

- **Utilisateurs non authentifiés** : Accès limité aux pages publiques
- **Utilisateurs authentifiés** : Accès à leur tableau de bord et aux réservations
- **Administrateurs** : Accès complet à l'interface d'administration

## API et intégrations

### Supabase

L'application utilise l'API Supabase pour :
- Opérations CRUD sur les tables
- Authentification et gestion des utilisateurs
- Stockage de fichiers (documents de profil)

### Fonctions Edge

Les fonctions serverless Deno sont utilisées pour :
- `initialize-database` : Configuration initiale de la base de données
- `test-database-connection` : Vérification de la connexion à la base de données
- `create-payment-session` : Création de sessions de paiement Stripe
- `get-google-reviews` : Récupération des avis Google

### Stripe

L'intégration avec Stripe gère :
- Création de sessions de paiement
- Webhooks pour les événements de paiement
- Gestion des paiements réussis/annulés

## Composants principaux

### Système de réservation

Le système de réservation comprend :
- Sélection d'espace
- Sélection de date et d'heure
- Calcul de prix
- Processus de paiement
- Confirmation et gestion des réservations

### Interface d'administration

L'interface d'administration permet de :
- Gérer les espaces (ajout, modification, suppression)
- Gérer les réservations (confirmation, annulation)
- Gérer les utilisateurs
- Configurer les paramètres du site
- Visualiser les statistiques

### Tableau de bord utilisateur

Le tableau de bord utilisateur affiche :
- Réservations en cours et passées
- Profil utilisateur
- Documents associés au profil
- Statistiques d'utilisation

## Flux de données

### Réservation d'un espace

1. L'utilisateur sélectionne un espace
2. L'utilisateur choisit une date et une plage horaire
3. Le système vérifie la disponibilité
4. Le système calcule le prix
5. L'utilisateur confirme et procède au paiement
6. Une fois le paiement confirmé, la réservation est créée

### Modification d'une réservation

1. L'utilisateur accède à sa réservation
2. L'utilisateur modifie les détails (date, heure, espace)
3. Le système recalcule le prix si nécessaire
4. L'utilisateur confirme les modifications
5. La réservation est mise à jour

## Tests

### Tests unitaires

Les tests unitaires couvrent :
- Fonctions utilitaires
- Hooks personnalisés
- Composants UI isolés

### Tests d'intégration

Les tests d'intégration vérifient :
- Flux de réservation complet
- Authentification et autorisation
- Intégration avec Supabase

### Tests d'accessibilité

Les tests d'accessibilité automatisés vérifient la conformité WCAG 2.1 AA.

## Performance

### Optimisations

- Lazy loading des composants
- Mise en cache des requêtes avec React Query
- Optimisation des images avec le composant OptimizedImage
- Code splitting
- Service Worker pour le support offline

### Métriques

Les Web Vitals sont mesurés et surveillés :
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)

## Sécurité

### Mesures de sécurité

- HTTPS obligatoire
- Protection CSRF
- Validation des entrées côté client et serveur
- Politiques RLS dans Supabase
- En-têtes de sécurité (CSP, HSTS, etc.)
- Sanitization des données HTML

### Gestion des vulnérabilités

- Analyse régulière des dépendances
- Tests de sécurité automatisés
- Processus de mise à jour des dépendances
