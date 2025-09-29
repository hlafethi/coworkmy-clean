# 🚀 CoworkMy - Guide de Configuration

## 📋 Configuration terminée avec succès !

Votre application CoworkMy est maintenant configurée avec votre base de données PostgreSQL VPS.

## 🗄️ Base de données configurée

- **Serveur** : 147.93.58.155:5432
- **Base** : `coworkmy`
- **Utilisateur** : `vpshostinger`
- **Tables créées** : profiles, spaces, bookings, payments, time_slots, admin_settings, support_faqs
- **RLS activé** avec politiques de sécurité

## 🚀 Démarrage de l'application

### Option 1 : Démarrage automatique (Recommandé)
```bash
# Windows
start-app.bat

# Linux/Mac
./start-app.sh
```

### Option 2 : Démarrage manuel
```bash
# Terminal 1 : Serveur API
node api-server.js

# Terminal 2 : Serveur de développement
npm run dev
```

## 🌐 Accès à l'application

- **Frontend** : http://localhost:5173
- **API** : http://localhost:5000
- **Santé API** : http://localhost:5000/api/health

## 👤 Création d'un compte administrateur

1. **Inscription normale** : Créez un compte via l'interface
2. **Promotion admin** : Exécutez cette requête SQL sur votre VPS :
   ```sql
   UPDATE profiles SET is_admin = true WHERE email = 'votre@email.com';
   ```

## 🔧 Fonctionnalités disponibles

### ✅ Authentification
- Connexion/Inscription via API
- Gestion des sessions JWT
- Détection des administrateurs

### ✅ Gestion des espaces
- Création et modification d'espaces
- Upload d'images
- Gestion des prix (heure/jour/demi-jour)

### ✅ Système de réservations
- Réservation d'espaces
- Gestion des créneaux horaires
- Historique des réservations

### ✅ Paiements
- Intégration Stripe
- Gestion des paiements
- Portail client Stripe

### ✅ Interface admin
- Dashboard administrateur
- Gestion des utilisateurs
- Statistiques et rapports

## 📊 Structure de l'API

### Authentification
- `POST /api/auth/signin` - Connexion
- `POST /api/auth/signup` - Inscription
- `GET /api/auth/me` - Profil utilisateur

### Espaces
- `GET /api/spaces` - Liste des espaces
- `POST /api/spaces` - Créer un espace

### Réservations
- `GET /api/bookings` - Mes réservations
- `POST /api/bookings` - Créer une réservation

### Admin
- `GET /api/admin/settings` - Paramètres admin

## 🔒 Sécurité

- **JWT Tokens** : Authentification sécurisée
- **RLS PostgreSQL** : Politiques de sécurité au niveau base
- **CORS** : Configuration pour les requêtes cross-origin
- **Validation** : Vérification des données côté serveur

## 🛠️ Développement

### Structure du projet
```
├── api-server.js          # Serveur API Express
├── src/
│   ├── lib/
│   │   └── api-client.ts  # Client API
│   ├── context/
│   │   └── AuthContextPostgreSQL.tsx  # Contexte auth
│   └── components/        # Composants React
```

### Variables d'environnement
```env
# API
API_PORT=5000
JWT_SECRET=coworkmy-secret-key-2025

# Base de données (dans api-server.js)
DB_HOST=147.93.58.155
DB_PORT=5432
DB_NAME=coworkmy
DB_USER=vpshostinger
DB_PASSWORD=Fethi@2025!
```

## 🎯 Prochaines étapes

1. **Testez l'application** : http://localhost:5173
2. **Créez un compte admin** : Via l'interface puis promotion SQL
3. **Configurez les espaces** : Ajoutez vos espaces de coworking
4. **Testez les réservations** : Vérifiez le système de booking

## 🆘 Support

En cas de problème :
1. Vérifiez que l'API fonctionne : http://localhost:5000/api/health
2. Vérifiez la connexion à la base de données
3. Consultez les logs dans la console

---

**🎉 Votre application CoworkMy est prête à l'emploi !**
