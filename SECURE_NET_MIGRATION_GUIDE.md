# Guide de Migration : pg_net → secure_net

## 🎯 Objectif

Ce guide explique comment migrer de `pg_net` vers `secure_net` pour améliorer la sécurité de votre application.

## ✅ État Actuel

- ✅ **pg_net installé et sécurisé** via des fonctions wrapper
- ✅ **Fonctions sécurisées disponibles** : `secure_net.http_get()` et `secure_net.http_post()`
- ✅ **Validation d'URL** : Seules HTTPS et localhost sont autorisées
- ✅ **Permissions contrôlées** : Accès sécurisé

## 🔄 Migration Automatique

### Exécuter le script de migration

1. **Ouvre l'éditeur SQL** dans ton Dashboard Supabase
2. **Exécute le script** : `migrate_pg_net_to_secure_net.sql`
3. **Vérifie les résultats** : Le script affichera le statut de la migration

## 📝 Changements de Code

### Avant (Non sécurisé)
```sql
-- Appels directs à pg_net
SELECT pg_net.http_get('http://example.com/api');
SELECT pg_net.http_post('http://example.com/api', '{"data": "value"}');
```

### Après (Sécurisé)
```sql
-- Appels via secure_net
SELECT secure_net.http_get('https://example.com/api');
SELECT secure_net.http_post('https://example.com/api', '{"data": "value"}');
```

## 🛡️ Avantages de Sécurité

### 1. **Validation d'URL**
- ✅ Seules les URLs HTTPS sont autorisées
- ✅ localhost autorisé pour le développement
- ❌ URLs HTTP non sécurisées rejetées

### 2. **Contrôle d'Accès**
- ✅ `SECURITY DEFINER` : Exécution avec privilèges élevés
- ✅ `search_path` fixé : Protection contre l'injection
- ✅ Permissions contrôlées

### 3. **Gestion d'Erreurs**
- ✅ Messages d'erreur sécurisés
- ✅ Validation des paramètres
- ✅ Gestion des exceptions

## 🔧 Utilisation dans les Fonctions

### Exemple de Fonction Sécurisée
```sql
CREATE OR REPLACE FUNCTION call_external_api(api_url text, data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Utiliser secure_net au lieu de pg_net
    RETURN secure_net.http_post(api_url, data::text);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur API: %', SQLERRM;
END;
$$;
```

## 🚀 Fonctions Supabase Edge

### Pas de Changement Nécessaire
Les fonctions Supabase Edge utilisent `fetch()` de Deno, pas `pg_net` :
```typescript
// ✅ Correct - Pas de changement nécessaire
const response = await fetch('https://api.example.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

## 📋 Checklist de Migration

### ✅ À Vérifier
- [ ] Exécuter le script de migration automatique
- [ ] Vérifier qu'aucune fonction n'utilise plus `pg_net` directement
- [ ] Tester les fonctions migrées
- [ ] Mettre à jour la documentation

### ✅ Pour les Nouvelles Développements
- [ ] Utiliser `secure_net.http_get()` au lieu de `pg_net.http_get()`
- [ ] Utiliser `secure_net.http_post()` au lieu de `pg_net.http_post()`
- [ ] S'assurer que les URLs sont en HTTPS
- [ ] Tester la validation d'URL

## 🧪 Tests

### Test de Fonctionnement
```sql
-- Test des fonctions sécurisées
SELECT secure_net.http_get('https://httpbin.org/get');
SELECT secure_net.http_post('https://httpbin.org/post', '{"test": "data"}');
```

### Test de Sécurité
```sql
-- Ces appels doivent échouer
SELECT secure_net.http_get('http://example.com'); -- ❌ HTTP non autorisé
SELECT secure_net.http_post('ftp://example.com', 'data'); -- ❌ Protocole non autorisé
```

## 🔍 Surveillance

### Vérifier l'État de Sécurité
```sql
-- Vérifier les fonctions sécurisées
SELECT * FROM secure_net.pg_net_security_status;
```

### Lister les Fonctions Utilisant secure_net
```sql
SELECT p.proname, pn.nspname
FROM pg_proc p
JOIN pg_namespace pn ON p.pronamespace = pn.oid
WHERE pg_get_functiondef(p.oid) LIKE '%secure_net.%';
```

## 🚨 Dépannage

### Erreur : "URL not allowed for security reasons"
**Cause** : URL non autorisée (HTTP au lieu de HTTPS)
**Solution** : Utiliser une URL HTTPS

### Erreur : "Function secure_net.http_get does not exist"
**Cause** : Fonctions sécurisées non installées
**Solution** : Exécuter `pg_net_install_and_secure.sql`

### Erreur : "Permission denied"
**Cause** : Permissions non configurées
**Solution** : Vérifier que l'utilisateur a les permissions sur `secure_net`

## 📞 Support

En cas de problème :
1. Vérifier les logs d'erreur
2. Exécuter les scripts de diagnostic
3. Contacter l'équipe de développement

---

**Note** : Cette migration améliore significativement la sécurité de votre application en contrôlant l'accès aux ressources externes. 