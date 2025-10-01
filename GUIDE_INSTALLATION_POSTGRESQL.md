# Guide d'installation PostgreSQL pour CoworkMy

## 1. Configuration de la base de données PostgreSQL

### Sur votre serveur VPS :

1. **Connectez-vous à votre serveur VPS**
   ```bash
   ssh user@your-vps-ip
   ```

2. **Installez PostgreSQL (si pas déjà installé)**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # CentOS/RHEL
   sudo yum install postgresql-server postgresql-contrib
   ```

3. **Démarrez PostgreSQL**
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

4. **Créez la base de données**
   ```bash
   sudo -u postgres psql
   ```
   
   Dans PostgreSQL :
   ```sql
   CREATE DATABASE coworkmy;
   CREATE USER coworkmy_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE coworkmy TO coworkmy_user;
   \q
   ```

5. **Exécutez le script d'initialisation**
   ```bash
   psql -h localhost -U coworkmy_user -d coworkmy -f init-database.sql
   ```

## 2. Configuration de l'application

### Créez le fichier `.env` :

```bash
cp env.example .env
```

### Modifiez le fichier `.env` avec vos paramètres :

```env
# Configuration de la base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coworkmy
DB_USER=coworkmy_user
DB_PASSWORD=your_secure_password
DB_SSL=false

# Configuration JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Configuration SMTP
SMTP_HOST=mail.coworkmy.fr
SMTP_PORT=587
SMTP_USER=contact@coworkmy.fr
SMTP_PASS=your-smtp-password
EMAIL_FROM=contact@coworkmy.fr

# Configuration API
API_PORT=5000
```

## 3. Installation des dépendances

```bash
npm install pg
```

## 4. Démarrage du serveur

```bash
node server.js
```

## 5. Test de la connexion

Le serveur devrait afficher :
```
✅ Connexion à PostgreSQL établie
🚀 API CoworkMy démarrée sur le port 5000
```

## 6. Comptes de test

### Compte administrateur :
- **Email** : `admin@coworkmy.fr`
- **Mot de passe** : `Project@2025*`

### Création d'un nouveau compte :
Utilisez l'endpoint `/api/auth/signup` ou l'interface d'inscription.

## 7. Structure de la base de données

Les tables créées :
- `users` - Utilisateurs
- `spaces` - Espaces de coworking
- `bookings` - Réservations
- `homepage_settings` - Paramètres de la page d'accueil
- `carousel_images` - Images du carrousel
- `support_tickets` - Tickets de support
- `support_ticket_responses` - Réponses aux tickets
- `admin_settings` - Paramètres administrateur

## 8. Sécurité

### Configuration PostgreSQL :
1. **Modifiez `postgresql.conf`** :
   ```bash
   sudo nano /etc/postgresql/*/main/postgresql.conf
   ```
   - `listen_addresses = 'localhost'` (ou votre IP)
   - `port = 5432`

2. **Modifiez `pg_hba.conf`** :
   ```bash
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   ```
   Ajoutez :
   ```
   local   coworkmy        coworkmy_user                    md5
   host    coworkmy        coworkmy_user    127.0.0.1/32    md5
   ```

3. **Redémarrez PostgreSQL** :
   ```bash
   sudo systemctl restart postgresql
   ```

## 9. Sauvegarde

### Sauvegarde automatique :
```bash
# Créez un script de sauvegarde
sudo nano /usr/local/bin/backup-coworkmy.sh
```

Contenu du script :
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U coworkmy_user coworkmy > /backup/coworkmy_$DATE.sql
find /backup -name "coworkmy_*.sql" -mtime +7 -delete
```

### Planification avec cron :
```bash
sudo crontab -e
# Ajoutez : 0 2 * * * /usr/local/bin/backup-coworkmy.sh
```

## 10. Monitoring

### Vérification de l'état :
```bash
# État de PostgreSQL
sudo systemctl status postgresql

# Connexions actives
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Taille de la base
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('coworkmy'));"
```

## 11. Dépannage

### Problèmes courants :

1. **Erreur de connexion** :
   - Vérifiez les paramètres dans `.env`
   - Testez la connexion : `psql -h localhost -U coworkmy_user -d coworkmy`

2. **Permissions insuffisantes** :
   ```sql
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO coworkmy_user;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO coworkmy_user;
   ```

3. **Port déjà utilisé** :
   - Changez `API_PORT` dans `.env`
   - Ou arrêtez le processus : `sudo lsof -ti:5000 | xargs kill -9`

## 12. Production

### Pour la production :
1. Utilisez un certificat SSL pour PostgreSQL
2. Configurez un firewall
3. Activez les logs PostgreSQL
4. Configurez un monitoring (ex: Prometheus + Grafana)
5. Utilisez un reverse proxy (nginx)
6. Configurez PM2 pour la gestion des processus Node.js

### Exemple de configuration PM2 :
```bash
npm install -g pm2
pm2 start server.js --name "coworkmy-api"
pm2 startup
pm2 save
```
