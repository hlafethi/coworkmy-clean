# 🔧 Résolution Erreur CREATE TABLE O2Switch

## ❌ Problème identifié

```
ERREUR: erreur de syntaxe sur ou près de « CREATE »
LINE 5: CREATE TABLE profiles (
```

## 🎯 Cause probable

1. **Tables existantes** qui causent des conflits
2. **Version PostgreSQL 9.6.22** très ancienne
3. **Syntaxe incompatible** avec cette version

## ✅ Solution recommandée

**Utilisez** : `scripts/migrate-o2switch-clean.sql`

Ce script :
- ✅ Supprime toutes les tables existantes
- ✅ Crée les tables avec une syntaxe compatible
- ✅ Évite les conflits de noms

## 📋 Étapes de résolution

### Étape 1 : Vérification
Dans phpPgAdmin, vérifiez s'il y a des tables existantes :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Étape 2 : Nettoyage complet
**Copiez-collez** le contenu de `scripts/migrate-o2switch-clean.sql`

Ce script supprime automatiquement :
- Toutes les tables existantes
- Toutes les vues existantes
- Tous les index existants

### Étape 3 : Exécution
1. Ouvrez phpPgAdmin
2. Sélectionnez votre base de données
3. Allez dans l'onglet "SQL"
4. Collez le script complet
5. Cliquez "Exécuter"

## 🆘 Si l'erreur persiste

### Option 1 : Exécution manuelle
Exécutez ces commandes une par une :

```sql
-- 1. Suppression
DROP TABLE IF EXISTS support_chat_sessions CASCADE;
DROP TABLE IF EXISTS support_messages CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS admin_settings CASCADE;
DROP TABLE IF EXISTS spaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Création d'une table de test
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(10) DEFAULT 'user'
);

-- 3. Test d'insertion
INSERT INTO profiles (id, email, full_name, role) 
VALUES ('1', 'test@test.com', 'Test User', 'admin');
```

### Option 2 : Version ultra-minimale
Si tout échoue, créez juste les tables essentielles :

```sql
-- Table minimale
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255)
);

CREATE TABLE spaces (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    price_per_hour DECIMAL(10,2) NOT NULL
);

CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES profiles(id),
    space_id VARCHAR(36) REFERENCES spaces(id),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    total_price DECIMAL(10,2) NOT NULL
);
```

## 🔍 Diagnostic

### Vérifiez la version PostgreSQL
```sql
SELECT version();
```

### Vérifiez les privilèges
```sql
SELECT current_user, current_database();
```

### Vérifiez l'espace disque
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## 📞 Support O2Switch

Si le problème persiste :
1. **Contactez** le support O2Switch
2. **Demandez** une mise à jour PostgreSQL
3. **Utilisez** MySQL comme alternative

## 🎯 Résultat attendu

Après exécution réussie :
```
Migration O2Switch terminée avec succès !
```

---

**💡 Conseil** : Le script `migrate-o2switch-clean.sql` est conçu spécifiquement pour résoudre ce type d'erreur. 