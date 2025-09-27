# 🔧 Guide PostgreSQL 9.6.22 O2Switch

## ❌ Problème identifié

PostgreSQL 9.6.22 est une version très ancienne qui ne supporte pas :
- ❌ `DROP TABLE IF EXISTS` (syntaxe moderne)
- ❌ `CREATE TABLE IF NOT EXISTS` (syntaxe moderne)
- ❌ `ON CONFLICT` (PostgreSQL 9.5+)
- ❌ Types ENUM (support limité)

## ✅ Solution recommandée

**Utilisez** : `scripts/migrate-o2switch-ultra-basic.sql`

Ce script est spécialement conçu pour PostgreSQL 9.6.22.

## 📋 Étapes de migration

### Étape 1 : Vérification de la base
Dans phpPgAdmin, vérifiez s'il y a des tables :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### Étape 2 : Nettoyage manuel (si nécessaire)
Si des tables existent, supprimez-les manuellement :
```sql
DROP TABLE support_chat_sessions CASCADE;
DROP TABLE support_messages CASCADE;
DROP TABLE time_slots CASCADE;
DROP TABLE payments CASCADE;
DROP TABLE bookings CASCADE;
DROP TABLE admin_settings CASCADE;
DROP TABLE spaces CASCADE;
DROP TABLE profiles CASCADE;
```

### Étape 3 : Migration
**Copiez-collez** le contenu de `scripts/migrate-o2switch-ultra-basic.sql`

## 🔄 Modifications pour PostgreSQL 9.6

### Avant (ne fonctionne pas)
```sql
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE IF NOT EXISTS profiles (...);
INSERT INTO profiles (...) ON CONFLICT DO NOTHING;
```

### Après (fonctionne)
```sql
DROP TABLE profiles CASCADE;
CREATE TABLE profiles (...);
INSERT INTO profiles (...);
```

## ⚠️ Important

### Si vous avez des erreurs "table does not exist"
C'est normal ! Cela signifie que les tables n'existaient pas. Continuez l'exécution.

### Si vous avez des erreurs "table already exists"
Supprimez d'abord les tables manuellement avec les commandes DROP.

## 🆘 Dépannage

### Erreur "relation does not exist"
```sql
-- Vérifiez les tables existantes
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Supprimez-les une par une si nécessaire
DROP TABLE nom_de_la_table CASCADE;
```

### Erreur "duplicate key value"
```sql
-- Supprimez les données existantes
DELETE FROM admin_settings;
DELETE FROM profiles;
DELETE FROM spaces;
```

### Erreur "syntax error"
Vérifiez que vous avez copié le bon fichier SQL (pas un fichier .md).

## 🎯 Résultat attendu

Après exécution réussie :
```
Migration O2Switch terminée avec succès !
```

## 📊 Vérification

Vérifiez que les tables ont été créées :
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Vous devriez voir :
- admin_settings
- bookings
- payments
- profiles
- spaces
- support_chat_sessions
- support_messages
- time_slots

## 🔍 Diagnostic

### Vérifiez la version exacte
```sql
SELECT version();
```

### Vérifiez les privilèges
```sql
SELECT current_user, current_database();
```

### Vérifiez l'espace disponible
```sql
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## 📞 Support

Si le problème persiste :
1. **Contactez** le support O2Switch
2. **Demandez** une mise à jour PostgreSQL (version 12+ recommandée)
3. **Utilisez** MySQL comme alternative

## 🎉 Succès

Une fois la migration réussie :
1. **Configurez** votre application pour utiliser O2Switch
2. **Testez** les fonctionnalités de base
3. **Migrez** vos données si nécessaire

---

**💡 Conseil** : PostgreSQL 9.6.22 est très ancien. Considérez demander une mise à jour à O2Switch. 