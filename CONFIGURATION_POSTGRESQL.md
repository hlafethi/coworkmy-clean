# Configuration PostgreSQL CoworkMy

## ✅ Statut actuel

Votre application CoworkMy est maintenant configurée pour utiliser votre base de données PostgreSQL VPS :

- **Host** : 147.93.58.155
- **Port** : 5432
- **Database** : coworkmy
- **User** : vpshostinger
- **SSL** : false

## 🔧 Configuration du fichier .env

Créez un fichier `.env` à la racine du projet avec le contenu suivant :

```env
# Configuration PostgreSQL VPS
DB_HOST=147.93.58.155
DB_PORT=5432
DB_NAME=coworkmy
DB_USER=vpshostinger
DB_PASSWORD=Fethi@2025!
DB_SSL=false

# Configuration JWT
JWT_SECRET=coworkmy-super-secret-jwt-key-2025

# Configuration SMTP
SMTP_HOST=mail.coworkmy.fr
SMTP_PORT=587
SMTP_USER=contact@coworkmy.fr
SMTP_PASS=
EMAIL_FROM=contact@coworkmy.fr

# Configuration API
API_PORT=5000
```

## 🚀 Démarrage du serveur

```bash
node server.js
```

## 📊 Endpoints disponibles

- ✅ `GET /api/health` - Santé de l'API
- ✅ `GET /api/spaces` - Liste des espaces (données de votre VPS)
- ✅ `GET /api/homepage-settings` - Paramètres homepage (données par défaut)
- ✅ `GET /api/carousel-images` - Images carrousel (données par défaut)
- ✅ `POST /api/auth/signin` - Connexion (compte test + base de données)
- ✅ `POST /api/auth/signup` - Inscription
- ✅ `GET /api/auth/me` - Informations utilisateur
- ✅ `POST /api/send-email` - Envoi d'emails

## 🔐 Comptes de test

### Compte administrateur (toujours disponible) :
- **Email** : `admin@coworkmy.fr`
- **Mot de passe** : `Project@2025*`

### Comptes de votre base de données :
Les utilisateurs existants dans votre base PostgreSQL peuvent se connecter normalement.

## 📋 Tables disponibles dans votre base

D'après les tests, votre base contient déjà :
- ✅ Table `spaces` avec des données (IDs UUID)
- ⚠️ Tables `homepage_settings` et `carousel_images` peuvent être créées si nécessaire

## 🛠️ Prochaines étapes recommandées

1. **Créer les tables manquantes** (si nécessaire) :
   ```sql
   -- Exécuter le script init-database.sql sur votre VPS
   psql -h 147.93.58.155 -U vpshostinger -d coworkmy -f init-database.sql
   ```

2. **Configurer les variables d'environnement** :
   - Créer le fichier `.env` avec les paramètres ci-dessus

3. **Tester l'application frontend** :
   - L'application devrait maintenant se charger sans erreurs 404
   - Les données des espaces proviennent de votre VPS
   - L'authentification fonctionne avec votre base de données

## 🔍 Vérification de la connexion

Pour tester la connexion à votre base de données :

```bash
# Test de connexion directe
psql -h 147.93.58.155 -U vpshostinger -d coworkmy

# Test via l'API
curl http://localhost:5000/api/health
curl http://localhost:5000/api/spaces
```

## 📝 Notes importantes

- Le serveur utilise maintenant votre base PostgreSQL VPS
- Les données des espaces proviennent de votre base existante
- Les paramètres homepage et carrousel utilisent des données par défaut
- L'authentification fonctionne avec votre base de données + compte de test
- Tous les endpoints retournent des données valides

Votre application CoworkMy est maintenant opérationnelle avec votre base de données PostgreSQL VPS ! 🎉

