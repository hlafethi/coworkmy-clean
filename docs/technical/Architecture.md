# Architecture de l'application

## Vue d'ensemble

L'application est construite avec les technologies suivantes :
- React pour l'interface utilisateur
- Supabase pour la base de données et l'authentification
- TanStack Query pour la gestion des données côté client
- Tailwind CSS pour le styling
- Stripe pour les paiements

## Structure du projet

```
src/
├── components/       # Composants React
│   ├── admin/        # Composants pour l'administration
│   ├── auth/         # Composants d'authentification
│   ├── booking/      # Composants de réservation
│   ├── common/       # Composants partagés
│   ├── dashboard/    # Composants du tableau de bord
│   ├── home/         # Composants de la page d'accueil
│   └── ui/           # Composants UI réutilisables
├── hooks/            # Hooks React personnalisés
├── integrations/     # Intégrations avec des services tiers
├── lib/              # Bibliothèques et utilitaires
├── pages/            # Composants de pages
├── tests/            # Tests
└── utils/            # Fonctions utilitaires
```

## Flux de données

1. **Authentification**
   - L'authentification est gérée par Supabase Auth
   - Le hook `useAuth` fournit l'état d'authentification à l'application

2. **Gestion des données**
   - TanStack Query est utilisé pour la gestion des données côté client
   - Les hooks personnalisés encapsulent la logique d'accès aux données

3. **Rendu côté client**
   - L'application est rendue côté client
   - React Router gère le routage

## Composants principaux

### Composants d'administration
Les composants d'administration sont utilisés pour gérer l'application. Ils sont accessibles uniquement aux utilisateurs ayant le rôle d'administrateur.

### Composants de réservation
Les composants de réservation permettent aux utilisateurs de réserver des espaces de coworking. Ils gèrent la sélection des espaces, des dates et des créneaux horaires.

### Composants de tableau de bord
Les composants de tableau de bord affichent les informations pertinentes pour l'utilisateur, comme ses réservations et les espaces disponibles.

## Intégrations

### Supabase
Supabase est utilisé pour :
- L'authentification des utilisateurs
- Le stockage des données
- Les fonctions RPC pour la logique métier
- Les Edge Functions pour les opérations serveur

### Stripe
Stripe est utilisé pour :
- Le traitement des paiements
- La gestion des abonnements
- Les webhooks pour les notifications de paiement

## Sécurité

### Row Level Security (RLS)
Supabase utilise RLS pour sécuriser les données. Chaque table a des politiques qui définissent qui peut lire, écrire, mettre à jour ou supprimer des données.

### Authentification
L'authentification est gérée par Supabase Auth, qui utilise JWT pour l'authentification.

## Monitoring et Logging

Un système de logging a été mis en place pour suivre les erreurs et les événements importants. Les logs sont stockés dans Supabase et peuvent être consultés par les administrateurs.

## Tests

L'application utilise :
- Jest pour les tests unitaires
- React Testing Library pour les tests de composants
- Cypress pour les tests d'intégration

## Déploiement

L'application est déployée sur o2switch, un hébergeur web français. Le déploiement est effectué manuellement en téléchargeant les fichiers générés par la commande `npm run build` sur le serveur.
