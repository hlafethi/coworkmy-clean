# 🚀 Guide de déploiement en production

## Approche recommandée : Build local + Déploiement optimisé

Cette approche est **beaucoup plus fiable** que l'installation npm sur le VPS.

### ✅ Avantages

- **Frontend pré-compilé** : Plus de problèmes d'installation npm
- **Nginx optimisé** : Serveur web performant pour les fichiers statiques  
- **Backend simple** : Installation npm minimale
- **Sécurité** : Pas de clés sensibles dans le code
- **Performance** : Assets optimisés et mis en cache

### 📋 Étapes de déploiement

#### 1. **Sur votre PC (déjà fait)**
```bash
npm run build  # ✅ Frontend compilé dans dist/
git push origin master  # ✅ Code poussé sur GitHub
```

#### 2. **Sur le VPS via SSH**
```bash
cd /opt/coworkmy
git pull origin master
```

#### 3. **Configuration des variables d'environnement**
```bash
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/coworkmy
JWT_SECRET=your-jwt-secret-here
SMTP_HOST=mail.heleam.com
SMTP_PORT=587
SMTP_USER=admin@heleam.com
SMTP_PASS=${SMTP_PASSWORD}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}
EOF
```

#### 4. **Déploiement avec Portainer**

1. Allez dans **Portainer > Stacks**
2. Créez une nouvelle stack nommée `coworkmy-production`
3. Utilisez le fichier `docker-compose.prod.yml`
4. Ajoutez les variables d'environnement depuis le fichier `.env`

### 🏗️ Architecture finale

```
Frontend (Nginx) : Port 3002 → Fichiers statiques compilés
Backend (Node.js) : Port 3003 → API et logique métier
```

### 🔧 Configuration Docker

- **Frontend** : Nginx sert les fichiers compilés (plus rapide)
- **Backend** : Node.js avec installation npm minimale
- **Variables** : Toutes les clés sensibles via variables d'environnement

Cette approche élimine tous les problèmes d'installation npm sur le VPS !
