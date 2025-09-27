# Configuration requise

Avant de lancer le projet, crée un fichier `.env.local` à la racine avec les variables suivantes :

```
VITE_SUPABASE_URL=...           # URL de ton projet Supabase Cloud (ex : https://xxxx.supabase.co)
VITE_SUPABASE_ANON_KEY=...      # Clé anonyme (anon) de ton projet Supabase Cloud
VITE_GOOGLE_MAPS_API_KEY=...    # Clé API Google Maps (active et restreinte)
```

- Récupère l'URL et la clé anon dans l'interface Supabase Cloud (Project Settings > API).
- Récupère la clé Google Maps dans Google Cloud Console (API activée, restreinte sur le domaine localhost et ton domaine de prod).
- **Aucune dépendance Docker ou Supabase local : tout passe par Supabase Cloud.**

# CoWorkMy

Une application moderne de gestion d'espaces de coworking construite avec React, TypeScript et Supabase.

## 🚀 Fonctionnalités

- **Gestion des espaces** : Création et gestion d'espaces de coworking
- **Réservations** : Système de réservation en temps réel
- **Authentification** : Connexion sécurisée avec Supabase Auth
- **Paiements** : Intégration Stripe pour les paiements
- **Interface admin** : Panel d'administration complet
- **Support client** : Chat en direct et système de tickets
- **Responsive** : Interface adaptée mobile et desktop

## 🛠️ Technologies

- **Frontend** : React 18, TypeScript, Tailwind CSS
- **Backend** : Supabase (PostgreSQL, Auth, Storage)
- **Paiements** : Stripe
- **Build** : Vite
- **Tests** : Jest, Cypress

## 📦 Installation

```bash
# Cloner le repository
git clone [URL_DU_DEPOT] coworkmy
cd coworkmy

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local

# Démarrer le serveur de développement
npm run dev
```

## Prérequis

- Node.js 18 ou supérieur
- npm 9 ou supérieur
- Compte Supabase
- Compte Stripe (pour les paiements)
- Compte Tawk.to (pour le support client)

## Déploiement sur o2switch

Pour déployer l'application sur o2switch à l'adresse www.coworkmy.fr, suivez les instructions détaillées dans le document [docs/DEPLOYMENT_O2SWITCH.md](docs/DEPLOYMENT_O2SWITCH.md).

### Étapes rapides de déploiement

1. Construire l'application pour la production

   **Option 1 : Ignorer les erreurs TypeScript (recommandé)**
   
   **Sur Windows:**
   ```
   # Dans l'invite de commandes (CMD)
   build-without-ts-check.bat
   
   # Dans PowerShell
   .\build-without-ts-check.ps1
   ```

   **Sur Unix/Linux/Mac:**
   ```bash
   # Rendre le script exécutable
   chmod +x build-without-ts-check.sh
   
   # Exécuter le script
   ./build-without-ts-check.sh
   ```
   
   **Option 2 : Avec vérification TypeScript partielle**
   
   **Sur Windows:**
   ```
   # Dans l'invite de commandes (CMD)
   build-for-production.bat
   
   # Dans PowerShell
   .\build-for-production.ps1
   ```

   **Sur Unix/Linux/Mac:**
   ```bash
   # Rendre le script exécutable
   chmod +x build-for-production.sh
   
   # Exécuter le script
   ./build-for-production.sh
   ```

2. Déployer les fichiers générés

   **Sur Unix/Linux/Mac:**
   ```bash
   # Rendre le script exécutable
   chmod +x deploy.sh
   
   # Exécuter le script avec vos identifiants o2switch
   ./deploy.sh votre_utilisateur serveur.o2switch.net
   ```

   **Sur Windows:**
   ```
   # Utiliser le script PowerShell pour déployer via FTP
   .\deploy-ftp.ps1 -Username "votre_utilisateur" -Password "votre_mot_de_passe" -Server "ftp.o2switch.net"
   ```
   
   Ou suivez les instructions manuelles dans le document de déploiement pour transférer les fichiers via FTP.

## Structure du projet

- `src/` - Code source de l'application
  - `components/` - Composants React
  - `hooks/` - Hooks React personnalisés
  - `pages/` - Pages de l'application
  - `utils/` - Utilitaires et fonctions d'aide
  - `integrations/` - Intégrations avec des services externes
- `public/` - Fichiers statiques
- `supabase/` - Configuration et migrations Supabase
- `docs/` - Documentation

## Documentation

- [Guide d'utilisation](docs/USER_GUIDE.md)
- [Documentation technique](docs/TECHNICAL.md)
- [Guide de déploiement](docs/DEPLOYMENT.md)
- [Guide de déploiement sur o2switch](docs/DEPLOYMENT_O2SWITCH.md)
- [Configuration de Tawk.to](docs/TAWKTO_SETUP.md)
- [Sécurité](docs/SECURITY.md)
- [Tests](docs/TESTS.md)
- [Changelog](docs/CHANGELOG.md)

## Développement

### Scripts disponibles

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Construire l'application pour la production
- `npm run preview` - Prévisualiser la version de production localement
- `npm run lint` - Linter le code
- `npm test` - Exécuter les tests
- `npm run test:e2e` - Exécuter les tests end-to-end
- `npm run test:a11y` - Exécuter les tests d'accessibilité

### Conventions de code

- TypeScript pour le typage statique
- ESLint pour le linting
- Prettier pour le formatage
- Composants fonctionnels avec hooks
- Tests avec Jest et Testing Library

## Licence

Propriétaire - Tous droits réservés

## Contact

Pour toute question ou assistance, contactez-nous à contact@coworkmy.fr
