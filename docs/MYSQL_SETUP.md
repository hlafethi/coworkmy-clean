# Configuration MySQL pour CoWorkMy

Ce guide vous explique comment configurer et utiliser MySQL comme base de données pour l'application CoWorkMy.

## 📋 Prérequis

- MySQL 8.0 ou supérieur installé
- Node.js 18+ et npm
- Accès administrateur à MySQL

## 🚀 Installation et Configuration

### 1. Installation de MySQL

#### Sur Windows :
```bash
# Télécharger MySQL Installer depuis https://dev.mysql.com/downloads/installer/
# Suivre l'assistant d'installation
# Créer un utilisateur root avec mot de passe
```

#### Sur macOS :
```bash
# Avec Homebrew
brew install mysql
brew services start mysql

# Ou avec MySQL Installer
# Télécharger depuis https://dev.mysql.com/downloads/mysql/
```

#### Sur Linux (Ubuntu/Debian) :
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Configuration de la base de données

#### Créer la base de données :
```sql
CREATE DATABASE coworkmy CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Créer un utilisateur (optionnel) :
```sql
CREATE USER 'coworkmy_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON coworkmy.* TO 'coworkmy_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configuration des variables d'environnement

Ajoutez les variables MySQL dans votre fichier `.env.local` :

```env
# Configuration MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=coworkmy
MYSQL_USER=root
MYSQL_PASSWORD=votre_mot_de_passe
MYSQL_SSL=false
```

### 4. Initialisation de la base de données

Exécutez le script d'initialisation :

```bash
# Test de connexion
npm run db:test-mysql

# Initialisation complète
npm run db:init-mysql
```

## 🔧 Scripts Disponibles

### Test de connexion
```bash
npm run db:test-mysql
```
Vérifie la connexion à MySQL et affiche les informations de configuration.

### Initialisation de la base de données
```bash
npm run db:init-mysql
```
Crée toutes les tables, vues, triggers et insère les données initiales.

## 📊 Structure de la Base de Données

### Tables Principales

- **profiles** : Profils utilisateurs
- **spaces** : Espaces de coworking
- **bookings** : Réservations
- **payments** : Paiements
- **reviews** : Avis et évaluations
- **notifications** : Notifications utilisateurs
- **support_tickets** : Tickets de support
- **support_messages** : Messages de support
- **faq** : Questions fréquentes
- **audit_logs** : Logs d'audit

### Vues Utiles

- **space_stats** : Statistiques des espaces
- **user_stats** : Statistiques utilisateurs

### Triggers Automatiques

- Mise à jour automatique des timestamps `updated_at`
- Calcul automatique des statistiques des espaces

## 🔍 Dépannage

### Erreur de connexion refusée
```
ECONNREFUSED
```
**Solutions :**
1. Vérifiez que MySQL est démarré
2. Vérifiez le port (3306 par défaut)
3. Vérifiez les paramètres de connexion

### Erreur d'accès refusé
```
ER_ACCESS_DENIED_ERROR
```
**Solutions :**
1. Vérifiez le nom d'utilisateur et mot de passe
2. Vérifiez les permissions de l'utilisateur
3. Connectez-vous en tant qu'administrateur MySQL

### Base de données inexistante
```
ER_BAD_DB_ERROR
```
**Solutions :**
1. Créez la base de données : `CREATE DATABASE coworkmy;`
2. Ou exécutez le script d'initialisation

### Problèmes de caractères
```
ER_INVALID_CHARACTER_STRING
```
**Solutions :**
1. Vérifiez que la base de données utilise `utf8mb4`
2. Vérifiez la configuration du client MySQL

## 🛠️ Commandes MySQL Utiles

### Connexion à MySQL
```bash
mysql -u root -p
```

### Voir les bases de données
```sql
SHOW DATABASES;
```

### Utiliser la base de données
```sql
USE coworkmy;
```

### Voir les tables
```sql
SHOW TABLES;
```

### Voir la structure d'une table
```sql
DESCRIBE profiles;
```

### Voir les triggers
```sql
SHOW TRIGGERS;
```

### Voir les vues
```sql
SHOW FULL TABLES WHERE Table_type = 'VIEW';
```

## 🔄 Migration depuis Supabase

Si vous migrez depuis Supabase vers MySQL :

1. **Exportez les données Supabase** :
   ```bash
   # Utilisez l'interface Supabase ou pg_dump
   pg_dump -h db.exffryodynkyizbeesbt.supabase.co -U postgres -d postgres > supabase_backup.sql
   ```

2. **Convertissez le format** :
   - Adaptez les types de données PostgreSQL vers MySQL
   - Convertissez les séquences en AUTO_INCREMENT
   - Adaptez les fonctions spécifiques à PostgreSQL

3. **Importez dans MySQL** :
   ```bash
   mysql -u root -p coworkmy < converted_backup.sql
   ```

## 📈 Performance

### Optimisations Recommandées

1. **Index** : Les index sont déjà créés pour les requêtes fréquentes
2. **Configuration MySQL** : Ajustez `my.cnf` selon vos besoins
3. **Pool de connexions** : Configuré pour 10 connexions simultanées
4. **Timeout** : 60 secondes pour les requêtes longues

### Monitoring

```sql
-- Voir les processus actifs
SHOW PROCESSLIST;

-- Voir les statistiques
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Threads_connected';
```

## 🔒 Sécurité

### Bonnes Pratiques

1. **Utilisateur dédié** : Créez un utilisateur spécifique pour l'application
2. **Permissions minimales** : Accordez seulement les permissions nécessaires
3. **Mot de passe fort** : Utilisez un mot de passe complexe
4. **Connexion locale** : Limitez l'accès à localhost en développement
5. **SSL** : Activez SSL en production

### Configuration de Sécurité

```sql
-- Créer un utilisateur avec permissions limitées
CREATE USER 'coworkmy_app'@'localhost' IDENTIFIED BY 'mot_de_passe_complexe';
GRANT SELECT, INSERT, UPDATE, DELETE ON coworkmy.* TO 'coworkmy_app'@'localhost';
REVOKE DROP, CREATE, ALTER ON coworkmy.* FROM 'coworkmy_app'@'localhost';
FLUSH PRIVILEGES;
```

## 📚 Ressources

- [Documentation MySQL](https://dev.mysql.com/doc/)
- [Guide d'installation MySQL](https://dev.mysql.com/doc/mysql-installation-excerpt/8.0/en/)
- [Référence des types de données](https://dev.mysql.com/doc/refman/8.0/en/data-types.html)
- [Guide d'optimisation](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)

## 🆘 Support

En cas de problème :

1. Vérifiez les logs MySQL : `/var/log/mysql/error.log`
2. Testez la connexion : `npm run db:test-mysql`
3. Consultez la documentation officielle MySQL
4. Ouvrez un ticket de support dans l'application
