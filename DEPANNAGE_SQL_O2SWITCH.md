# 🔧 Dépannage SQL O2Switch

## ❌ Erreurs courantes et solutions

### 1. Erreur `CREATE EXTENSION`
```
ERREUR: erreur de syntaxe sur ou près de « CREATE »
LINE 5: CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

**Solution** : Utilisez `scripts/migrate-o2switch-basic.sql` (sans extensions)

### 2. Erreur `CREATE TYPE ENUM`
```
ERREUR: erreur de syntaxe sur ou près de « CREATE »
LINE 5: CREATE TYPE user_role AS ENUM ('user', 'admin');
```

**Solution** : Utilisez `scripts/migrate-o2switch-basic.sql` (avec CHECK constraints)

### 3. Erreur `ON CONFLICT`
```
ERREUR: syntaxe invalide pour "ON CONFLICT"
```

**Solution** : Remplacez par `ON DUPLICATE KEY UPDATE` ou supprimez la clause

## ✅ Script recommandé

**Utilisez toujours** : `scripts/migrate-o2switch-basic.sql`

Ce script est compatible avec :
- ✅ PostgreSQL 9.x (O2Switch)
- ✅ PostgreSQL 10.x
- ✅ PostgreSQL 11.x
- ✅ PostgreSQL 12.x

## 🔄 Modifications apportées

### Avant (ne fonctionne pas)
```sql
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role DEFAULT 'user'
);
```

### Après (fonctionne)
```sql
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);
```

## 📋 Étapes de migration

1. **Supprimez** les tables existantes si elles existent
2. **Copiez** le contenu de `scripts/migrate-o2switch-basic.sql`
3. **Collez** dans phpPgAdmin
4. **Exécutez** le script
5. **Vérifiez** le message de succès

## 🆘 Si l'erreur persiste

### Option 1 : Exécution par parties
Divisez le script en sections et exécutez-les une par une :

```sql
-- Partie 1 : Tables de base
CREATE TABLE IF NOT EXISTS profiles (...);
CREATE TABLE IF NOT EXISTS spaces (...);

-- Partie 2 : Tables avec relations
CREATE TABLE IF NOT EXISTS bookings (...);
CREATE TABLE IF NOT EXISTS payments (...);

-- Partie 3 : Données
INSERT INTO admin_settings (...);
INSERT INTO profiles (...);
INSERT INTO spaces (...);
```

### Option 2 : Version minimale
Si tout échoue, créez juste les tables essentielles :

```sql
-- Table minimale pour tester
CREATE TABLE IF NOT EXISTS profiles (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(10) DEFAULT 'user'
);

-- Test d'insertion
INSERT INTO profiles (id, email, full_name, role) 
VALUES ('1', 'admin@test.com', 'Admin', 'admin');
```

## 🎯 Vérification

Après exécution réussie, vous devriez voir :
```
Migration O2Switch terminée avec succès !
```

## 📞 Support

Si le problème persiste :
1. **Vérifiez** la version PostgreSQL dans phpPgAdmin
2. **Testez** avec une table simple
3. **Contactez** le support O2Switch
4. **Utilisez** MySQL comme alternative

---

**💡 Conseil** : Commencez toujours par le script le plus basique et ajoutez les fonctionnalités progressivement. 