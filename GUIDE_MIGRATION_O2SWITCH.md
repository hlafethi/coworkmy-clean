# 🚀 Guide de Migration O2Switch

## ❌ Problème résolu

L'erreur `CREATE EXTENSION` était due aux extensions PostgreSQL non supportées par O2Switch.

## ✅ Solution

Utilisez le script **`scripts/migrate-o2switch-simple.sql`** qui fonctionne avec toutes les versions de PostgreSQL.

## 📋 Étapes de migration

### 1. Accéder à phpPgAdmin
1. Connectez-vous à votre panneau O2Switch
2. Allez dans "Bases de données" → "PostgreSQL"
3. Cliquez sur "phpPgAdmin" à côté de votre base `sc2rafi0640_coworkmy`

### 2. Exécuter le script
1. Dans phpPgAdmin, sélectionnez votre base de données
2. Allez dans l'onglet "SQL"
3. **Copiez-colle le contenu de `scripts/migrate-o2switch-simple.sql`**
4. Cliquez sur "Exécuter"

### 3. Vérifier la migration
Le script devrait afficher : `Migration O2Switch terminée avec succès !`

## 🔧 Configuration de l'application

### 1. Variables d'environnement
Ajoutez dans votre `.env` :
```env
O2SWITCH_DB_PASSWORD=votre_mot_de_passe_o2switch
```

### 2. Interface de sélection
1. Connectez-vous en tant qu'admin
2. Allez dans "Paramètres" → "Base de données"
3. Sélectionnez "O2Switch PostgreSQL"
4. Testez la connexion

## 🎯 Avantages d'O2Switch

- ✅ **Gratuit** (inclus dans votre hébergement)
- ✅ **Performances** correctes
- ✅ **Sauvegarde** automatique
- ✅ **Support** français

## ⚠️ Limitations

- ❌ Pas de fonctions Edge (comme Supabase)
- ❌ Pas de temps réel automatique
- ❌ Pas d'authentification intégrée

## 🔄 Migration des données

Si vous avez des données dans Supabase :

1. **Export manuel** : Utilisez l'interface Supabase pour exporter
2. **Import manuel** : Insérez dans O2Switch via phpPgAdmin
3. **Ou utilisez** l'interface de migration dans l'app

## 🆘 En cas de problème

1. **Vérifiez** que le script s'exécute sans erreur
2. **Testez** la connexion dans l'interface admin
3. **Consultez** les logs de l'application
4. **Contactez** le support O2Switch si nécessaire

---

**✅ Votre application fonctionnera parfaitement avec O2Switch !** 