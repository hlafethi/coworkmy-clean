# Configuration Multi-Base de Données

Ce guide explique comment configurer et utiliser l'application avec différentes bases de données (Supabase, PostgreSQL O2Switch, MySQL).

## 🎯 Vue d'ensemble

L'application supporte maintenant 3 types de bases de données :
- **Supabase** : Base cloud avec fonctions Edge
- **PostgreSQL O2Switch** : Base PostgreSQL hébergée chez O2Switch
- **MySQL** : Base MySQL classique

## 📋 Prérequis

### 1. Variables d'environnement

Créez un fichier `.env` avec les configurations suivantes :

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_DB_PASSWORD=your-db-password

# O2Switch PostgreSQL
O2SWITCH_DB_PASSWORD=your-o2switch-password

# MySQL
MYSQL_DB_PASSWORD=your-mysql-password
```

### 2. Dépendances

```bash
npm install mysql2 pg
```

## 🚀 Configuration des bases

### 1. Supabase (Déjà configuré)

Supabase est configuré par défaut. Assurez-vous que vos variables d'environnement sont correctes.

### 2. PostgreSQL O2Switch

#### Étape 1 : Accéder à phpPgAdmin
1. Connectez-vous à votre panneau O2Switch
2. Allez dans "Bases de données" → "PostgreSQL"
3. Cliquez sur "phpPgAdmin" à côté de votre base

#### Étape 2 : Exécuter le script SQL
1. Dans phpPgAdmin, sélectionnez votre base de données
2. Allez dans l'onglet "SQL"
3. Copiez-colle le contenu de `scripts/migrate-o2switch-simple.sql`
4. Cliquez sur "Exécuter"

### 3. MySQL

#### Étape 1 : Accéder à phpMyAdmin
1. Connectez-vous à votre panneau O2Switch
2. Allez dans "Bases de données" → "MySQL"
3. Cliquez sur "phpMyAdmin"

#### Étape 2 : Exécuter le script SQL
1. Dans phpMyAdmin, sélectionnez votre base de données
2. Allez dans l'onglet "SQL"
3. Copiez-colle le contenu de `scripts/migrate-to-mysql.sql`
4. Cliquez sur "Exécuter"

## 🔄 Migration des données

### Test des connexions

```bash
node scripts/migrate-database.js test
```

### Migration entre bases

```bash
# De Supabase vers O2Switch
node scripts/migrate-database.js migrate supabase o2switch

# De Supabase vers MySQL
node scripts/migrate-database.js migrate supabase mysql

# D'O2Switch vers MySQL
node scripts/migrate-database.js migrate o2switch mysql
```

## 🎛️ Interface utilisateur

### Sélecteur de base de données

L'application inclut un composant `DatabaseSelector` qui permet de :

1. **Choisir la base active** : Sélectionnez entre Supabase, O2Switch ou MySQL
2. **Tester la connexion** : Vérifiez que la base sélectionnée fonctionne
3. **Migrer les données** : Copiez automatiquement les données d'une base vers une autre

### Accès au sélecteur

1. Connectez-vous en tant qu'administrateur
2. Allez dans "Paramètres" → "Base de données"
3. Utilisez l'interface pour gérer vos bases

## 🔧 Configuration technique

### Structure des fichiers

```
src/
├── config/
│   └── database.ts          # Configuration multi-base
├── lib/
│   ├── database-client.ts   # Client unifié
│   ├── postgresql.ts        # Client PostgreSQL
│   ├── mysql.ts            # Client MySQL
│   └── supabase.ts         # Client Supabase
└── components/
    └── admin/
        └── DatabaseSelector.tsx  # Interface de sélection
```

### Client unifié

Le `databaseClient` gère automatiquement les 3 types de bases :

```typescript
import { databaseClient } from '../lib/database-client';

// Opérations automatiquement adaptées selon la base active
const result = await databaseClient.select('profiles', ['id', 'email']);
const newUser = await databaseClient.insert('profiles', { email: 'test@example.com' });
```

## 🛠️ Dépannage

### Erreur de connexion O2Switch

**Problème** : Timeout lors de la connexion à O2Switch

**Solution** : Utilisez phpPgAdmin au lieu de la connexion directe
1. Accédez à phpPgAdmin via votre panneau O2Switch
2. Exécutez manuellement le script SQL
3. L'application fonctionnera normalement

### Erreur MySQL

**Problème** : Port 3306 fermé

**Solution** : Utilisez phpMyAdmin
1. Accédez à phpMyAdmin via votre panneau O2Switch
2. Exécutez manuellement le script SQL
3. L'application fonctionnera normalement

### Limite Supabase atteinte

**Problème** : Fonctions Edge bloquées

**Solution** : Migrez vers O2Switch ou MySQL
1. Utilisez le sélecteur de base pour migrer
2. Configurez les nouvelles clés Stripe
3. Testez les fonctionnalités

## 📊 Comparaison des bases

| Fonctionnalité | Supabase | O2Switch | MySQL |
|----------------|----------|----------|-------|
| Fonctions Edge | ✅ | ❌ | ❌ |
| Temps réel | ✅ | ❌ | ❌ |
| Authentification | ✅ | ❌ | ❌ |
| Stockage fichiers | ✅ | ❌ | ❌ |
| Coût | Payant | Gratuit | Gratuit |
| Performance | Excellente | Bonne | Bonne |

## 🔐 Sécurité

### Variables d'environnement

- Ne committez jamais les mots de passe dans Git
- Utilisez des variables d'environnement pour tous les secrets
- Changez régulièrement les mots de passe

### Connexions sécurisées

- Supabase : SSL automatique
- O2Switch : Connexion locale sécurisée
- MySQL : Connexion locale sécurisée

## 📈 Performance

### Optimisations

1. **Index** : Tous les scripts créent les index nécessaires
2. **Pool de connexions** : Gestion automatique des connexions
3. **Requêtes optimisées** : Utilisation de requêtes préparées

### Monitoring

Utilisez les outils de votre hébergeur pour surveiller :
- Utilisation CPU
- Utilisation mémoire
- Temps de réponse des requêtes

## 🆘 Support

En cas de problème :

1. Vérifiez les logs de l'application
2. Testez les connexions avec le script de test
3. Consultez la documentation de votre hébergeur
4. Contactez le support technique

## 🔄 Mise à jour

Pour mettre à jour le système multi-base :

1. Sauvegardez vos données
2. Mettez à jour les scripts de migration
3. Testez sur une base de développement
4. Appliquez en production

---

**Note** : Ce système permet une flexibilité maximale tout en maintenant la compatibilité avec toutes les fonctionnalités de l'application. 