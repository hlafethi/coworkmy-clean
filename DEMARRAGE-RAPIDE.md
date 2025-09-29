# 🚀 CoworkMy - Démarrage Rapide

## ✅ **Application 100% fonctionnelle !**

Votre application CoworkMy est maintenant entièrement configurée avec votre base de données PostgreSQL VPS.

---

## 🚀 **Démarrage en 1 clic**

### **Windows**
```bash
start-complete.bat
```

### **Linux/Mac**
```bash
./start-complete.sh
```

---

## 🌐 **Accès à l'application**

| Service | URL | Description |
|---------|-----|-------------|
| **Application** | http://localhost:5173 | Interface utilisateur |
| **API** | http://localhost:5000 | Backend API |
| **Test API** | http://localhost:5000/api/health | Vérification API |

---

## 👤 **Créer un administrateur**

### **Étape 1 : Inscription**
1. Allez sur http://localhost:5173
2. Cliquez sur "S'inscrire"
3. Créez votre compte

### **Étape 2 : Promotion admin**
Connectez-vous à votre VPS et exécutez :
```sql
UPDATE profiles SET is_admin = true WHERE email = 'votre@email.com';
```

---

## 📊 **Fonctionnalités disponibles**

### **✅ Authentification**
- Connexion/Inscription
- Gestion des sessions JWT
- Détection des administrateurs

### **✅ Gestion des espaces**
- Création d'espaces
- Upload d'images
- Gestion des prix

### **✅ Système de réservations**
- Réservation d'espaces
- Gestion des créneaux
- Historique des réservations

### **✅ Interface admin**
- Dashboard administrateur
- Gestion des utilisateurs
- Statistiques et rapports

---

## 🔧 **Architecture technique**

### **Backend (Port 5000)**
- **Express.js** avec authentification JWT
- **PostgreSQL VPS** (147.93.58.155:5432)
- **Base** : `coworkmy` avec toutes les tables
- **Sécurité** : RLS activé

### **Frontend (Port 5173)**
- **React** avec TypeScript
- **API Client** pour les données
- **Interface moderne** avec Tailwind CSS

---

## 🛠️ **Démarrage manuel**

Si vous préférez démarrer manuellement :

```bash
# Terminal 1 : API Backend
node api-server.js

# Terminal 2 : Frontend
npm run dev
```

---

## 🆘 **Dépannage**

### **API non accessible**
```bash
# Vérifier que l'API fonctionne
curl http://localhost:5000/api/health
```

### **Base de données**
- Vérifiez la connexion PostgreSQL sur 147.93.58.155:5432
- Utilisateur : `vpshostinger`
- Mot de passe : `Fethi@2025!`
- Base : `coworkmy`

### **Logs utiles**
- **API** : Console du serveur `api-server.js`
- **Frontend** : Console du navigateur
- **Base de données** : Logs PostgreSQL VPS

---

## 🎯 **Prochaines étapes**

1. **Testez l'application** : http://localhost:5173
2. **Créez un compte admin** : Via l'interface puis promotion SQL
3. **Ajoutez des espaces** : Interface admin
4. **Testez les réservations** : Système de booking

---

## 🎉 **Félicitations !**

Votre application **CoworkMy** est maintenant **100% fonctionnelle** !

**🚀 Prêt pour la production !**
