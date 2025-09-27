# Guide de déploiement sur o2switch

Ce document détaille les étapes spécifiques pour déployer l'application sur un hébergement o2switch à l'adresse www.coworkmy.fr.

## Prérequis

- Un compte o2switch avec accès FTP et SSH
- Un domaine configuré (www.coworkmy.fr)
- Git installé sur votre machine locale
- Node.js (version 18 ou supérieure) installé sur votre machine locale

## Étapes de déploiement

### 1. Préparation du code

```bash
# Cloner le dépôt (si ce n'est pas déjà fait)
git clone [URL_DU_DEPOT] coworkmy
cd coworkmy

# Installer les dépendances
npm install

# Construire l'application pour la production

## Option 1 : Ignorer les erreurs TypeScript (recommandé)

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

## Option 2 : Avec vérification TypeScript partielle

**Sur Windows:**
```
# Dans l'invite de commandes (CMD)
build-for-production.bat

# Dans PowerShell
.\build-for-production.bat
# ou utilisez le script PowerShell dédié
.\build-for-production.ps1
```

**Sur Unix/Linux/Mac:**
```bash
# Rendre le script exécutable
chmod +x build-for-production.sh

# Exécuter le script
./build-for-production.sh
```

## Option 3 : Manuellement
```bash
# Construire l'application directement avec Vite (sans TypeScript)
npx vite build --emptyOutDir

# Copier le fichier .htaccess dans le dossier dist
cp .htaccess dist/.htaccess  # Sur Unix/Linux/Mac
copy .htaccess dist\.htaccess  # Sur Windows
```
```

### 2. Configuration des variables d'environnement

Le fichier `.env.production` a déjà été créé avec les valeurs appropriées pour l'environnement de production. Assurez-vous de mettre à jour les valeurs suivantes avec vos informations réelles :

- `SUPABASE_SERVICE_ROLE_KEY`: Votre clé de rôle de service Supabase
- `JWT_SECRET`, `CSRF_SECRET`, `ENCRYPTION_KEY`, `COOKIE_SECRET`: Générez des chaînes aléatoires sécurisées
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`: Vos clés Stripe
- `SMTP_PASSWORD`: Votre mot de passe SMTP
- `GOOGLE_API_KEY`, `GOOGLE_PLACE_ID`: Vos clés Google API
- `SENTRY_DSN`: Votre DSN Sentry

### 3. Transfert des fichiers vers o2switch

#### Via FTP

**Manuellement :**
1. Connectez-vous à votre compte FTP o2switch avec les identifiants fournis
2. Naviguez vers le répertoire racine de votre site (généralement `www` ou `public_html`)
3. Transférez tout le contenu du dossier `dist/` généré lors de l'étape de build
4. Transférez également le fichier `.htaccess` à la racine

**Avec le script PowerShell (Windows) :**
```powershell
# Utiliser le script PowerShell pour déployer via FTP
.\deploy-ftp.ps1 -Username "votre_utilisateur" -Password "votre_mot_de_passe" -Server "ftp.o2switch.net"
```

#### Via SSH et rsync (recommandé)

```bash
# Se connecter au serveur o2switch
ssh utilisateur@serveur.o2switch.net

# Créer un répertoire temporaire pour le déploiement
mkdir -p ~/deploy_temp

# Quitter la connexion SSH
exit

# Transférer les fichiers avec rsync
rsync -avz --delete ./dist/ utilisateur@serveur.o2switch.net:~/deploy_temp/

# Se reconnecter au serveur
ssh utilisateur@serveur.o2switch.net

# Déplacer les fichiers vers le répertoire web
cp -R ~/deploy_temp/* ~/www/

# Copier le fichier .htaccess
cp ~/deploy_temp/.htaccess ~/www/

# Nettoyer
rm -rf ~/deploy_temp

# Quitter la connexion SSH
exit
```

### 4. Configuration du domaine et SSL

1. Connectez-vous à votre espace client o2switch
2. Allez dans la section "Domaines" et assurez-vous que www.coworkmy.fr est correctement configuré
3. Activez le SSL via Let's Encrypt dans la section "SSL/TLS"

### 5. Vérification du déploiement

1. Visitez https://www.coworkmy.fr pour vérifier que le site fonctionne correctement
2. Testez la navigation entre les différentes pages pour s'assurer que le routage SPA fonctionne
3. Testez l'authentification et les fonctionnalités principales
4. Vérifiez que Tawk.to est correctement intégré

### 6. Configuration des redirections

Assurez-vous que les redirections suivantes sont configurées dans votre panneau o2switch :

1. HTTP vers HTTPS
2. domaine nu (coworkmy.fr) vers www (www.coworkmy.fr)

## Maintenance et mises à jour

### Mise à jour de l'application

Pour mettre à jour l'application :

```bash
# Récupérer les dernières modifications
git pull

# Installer les dépendances
npm install

# Construire l'application
npm run build

# Déployer les fichiers mis à jour (via FTP ou SSH comme décrit précédemment)
```

### Surveillance et monitoring

1. Configurez des alertes pour les erreurs serveur dans votre espace client o2switch
2. Mettez en place une surveillance des performances avec un outil comme UptimeRobot

### Sauvegardes

1. Configurez des sauvegardes régulières de la base de données Supabase
2. Utilisez la fonctionnalité de sauvegarde automatique d'o2switch pour les fichiers

## Résolution des problèmes courants

### Problème de routage SPA

Si les routes ne fonctionnent pas correctement (erreur 404 lors de l'actualisation d'une page) :

1. Vérifiez que le fichier `.htaccess` est correctement transféré à la racine du site
2. Assurez-vous que le module `mod_rewrite` est activé sur votre hébergement o2switch (il l'est généralement par défaut)

### Problèmes de connexion à Supabase

Si l'application ne peut pas se connecter à Supabase :

1. Vérifiez que les variables d'environnement `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont correctement définies
2. Assurez-vous que les règles CORS dans Supabase autorisent votre domaine www.coworkmy.fr

### Problèmes avec Tawk.to

Si le widget Tawk.to ne s'affiche pas :

1. Vérifiez que le script dans `index.html` contient le bon ID de propriété et de widget
2. Assurez-vous que le domaine www.coworkmy.fr est autorisé dans les paramètres de votre compte Tawk.to

## Contacts et support

- Support o2switch : support@o2switch.fr ou via votre espace client
- Support Supabase : https://supabase.com/support
- Support Tawk.to : https://www.tawk.to/support/

---

Ce document est un guide vivant qui doit être mis à jour régulièrement pour refléter les changements dans l'infrastructure et les procédures de déploiement.

Dernière mise à jour : 2 mai 2025
