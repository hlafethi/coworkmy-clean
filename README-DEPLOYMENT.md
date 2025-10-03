# 🚀 Guide de Déploiement CoworkMy

## 📋 Prérequis

- ✅ **VPS** avec Docker installé
- ✅ **Portainer.io** configuré
- ✅ **Nginx Proxy Manager** installé
- ✅ **Domaine** : `coworkmy.fr` pointant vers votre VPS

## 🔧 Configuration

### 1. Préparation des fichiers

```bash
# Cloner le repository
git clone https://github.com/hlafethi/coworkmy-clean.git
cd coworkmy-clean

# Copier le fichier d'environnement
cp env.production .env.production
```

### 2. Configuration des variables d'environnement

Éditez le fichier `.env.production` avec vos vraies clés :

```bash
# Base de données
DB_PASSWORD=your_secure_database_password_here

# JWT Secret (OBLIGATOIRE)
JWT_SECRET=your_very_strong_jwt_secret_key_here

# Configuration Stripe (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Configuration SMTP
SMTP_HOST=mail.coworkmy.fr
SMTP_PORT=587
SMTP_USER=contact@coworkmy.fr
SMTP_PASS=your_smtp_password_here
EMAIL_FROM=contact@coworkmy.fr
```

### 3. Déploiement avec Docker

```bash
# Déploiement automatique
./deploy.sh

# Ou déploiement manuel
docker-compose up -d --build
```

## 🌐 Configuration Nginx Proxy Manager

### 1. Créer un nouveau Proxy Host

- **Domain Names** : `coworkmy.fr`, `www.coworkmy.fr`
- **Scheme** : `http`
- **Forward Hostname/IP** : `localhost` (ou IP de votre serveur)
- **Forward Port** : `3000`
- **Cache Assets** : ✅ Activé
- **Block Common Exploits** : ✅ Activé
- **Websockets Support** : ✅ Activé

### 2. Configuration SSL

- **SSL Certificate** : Let's Encrypt
- **Force SSL** : ✅ Activé
- **HTTP/2 Support** : ✅ Activé
- **HSTS Enabled** : ✅ Activé

### 3. Configuration avancée (optionnel)

```nginx
# Ajouter dans "Advanced" pour optimiser les performances
client_max_body_size 10M;
proxy_read_timeout 300s;
proxy_connect_timeout 75s;
proxy_send_timeout 300s;
```

## 🔒 Configuration de sécurité

### 1. Firewall

```bash
# Ouvrir les ports nécessaires
ufw allow 80
ufw allow 443
ufw allow 22
ufw enable
```

### 2. Variables d'environnement sécurisées

```bash
# Générer des clés sécurisées
npm run generate:secrets

# Utiliser les clés générées dans .env.production
```

## 📊 Monitoring

### 1. Vérification du déploiement

```bash
# Statut des conteneurs
docker-compose ps

# Logs de l'application
docker-compose logs -f coworkmy-app

# Logs de la base de données
docker-compose logs -f postgres
```

### 2. Tests de connectivité

```bash
# Test de l'application
curl -f http://localhost:3000/health

# Test de la base de données
docker-compose exec postgres psql -U coworkmy_user -d coworkmy -c "SELECT 1;"
```

## 🔄 Mise à jour

```bash
# Mise à jour de l'application
git pull origin main
docker-compose down
docker-compose up -d --build
```

## 🛠️ Commandes utiles

```bash
# Redémarrer l'application
docker-compose restart coworkmy-app

# Voir les logs en temps réel
docker-compose logs -f

# Accéder à la base de données
docker-compose exec postgres psql -U coworkmy_user -d coworkmy

# Sauvegarder la base de données
docker-compose exec postgres pg_dump -U coworkmy_user coworkmy > backup.sql

# Restaurer la base de données
docker-compose exec -T postgres psql -U coworkmy_user -d coworkmy < backup.sql
```

## 🚨 Dépannage

### Problèmes courants

1. **Application non accessible**
   ```bash
   docker-compose logs coworkmy-app
   ```

2. **Base de données non accessible**
   ```bash
   docker-compose logs postgres
   ```

3. **Problèmes de permissions**
   ```bash
   sudo chown -R $USER:$USER .
   ```

4. **Port déjà utilisé**
   ```bash
   sudo netstat -tulpn | grep :3000
   ```

## 📞 Support

En cas de problème, vérifiez :
- ✅ Les logs des conteneurs
- ✅ La configuration Nginx Proxy Manager
- ✅ Les variables d'environnement
- ✅ La connectivité réseau

## 🎉 Félicitations !

Votre application CoworkMy est maintenant déployée et accessible sur https://coworkmy.fr !
