# 🔍 Diagnostic Synchronisation Stripe

## 📋 Problème identifié
Tu as créé un espace mais rien n'apparaît sur Stripe. Voici le diagnostic étape par étape.

## 🔧 Vérifications à effectuer

### 1. **Vérifier que le trigger SQL existe**
```sql
-- Exécuter dans Supabase SQL Editor
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_stripe_sync_on_spaces';
```

**Résultat attendu :**
- `trigger_stripe_sync_on_spaces` doit être présent
- `event_manipulation` : INSERT, UPDATE, DELETE
- `action_timing` : AFTER

### 2. **Vérifier que la fonction existe**
```sql
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'sync_space_with_stripe';
```

**Résultat attendu :**
- `sync_space_with_stripe` doit être présent
- `routine_type` : FUNCTION

### 3. **Tester l'edge function manuellement**
```bash
curl -X POST "https://exffryodynkyizbeesbt.supabase.co/functions/v1/sync-space-stripe" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SERVICE_ROLE_KEY]" \
  -d '{
    "type": "INSERT",
    "table": "spaces",
    "record": {
      "id": "test-123",
      "name": "Test Manual",
      "price_per_hour": 25.00,
      "capacity": 4
    }
  }'
```

**Résultat attendu :**
- Status 200
- Réponse JSON avec `success: true`

### 4. **Vérifier les secrets Supabase**
```bash
supabase secrets list
```

**Résultat attendu :**
- `STRIPE_SECRET_KEY` doit être présent
- `SERVICE_ROLE_KEY` doit être présent

### 5. **Vérifier les logs de l'edge function**
Dans le dashboard Supabase :
1. Aller dans **Functions**
2. Cliquer sur **sync-space-stripe**
3. Aller dans l'onglet **Logs**
4. Vérifier s'il y a des erreurs

### 6. **Tester la création d'un espace**
```sql
-- Créer un espace de test
INSERT INTO spaces (name, description, capacity, price_per_hour, is_active) 
VALUES ('Test Diagnostic', 'Espace de test diagnostic', 5, 20.00, true);

-- Vérifier immédiatement après
SELECT id, name, stripe_product_id, stripe_price_id, created_at 
FROM spaces 
WHERE name = 'Test Diagnostic'
ORDER BY created_at DESC
LIMIT 1;
```

## 🚨 Problèmes possibles et solutions

### **Problème 1 : Trigger non créé**
**Symptôme :** Aucun trigger dans la liste
**Solution :** 
```sql
-- Exécuter le script manuel
\i apply_stripe_trigger_manual.sql
```

### **Problème 2 : Edge function non accessible**
**Symptôme :** Erreur 404 ou 401
**Solution :**
```bash
# Redéployer l'edge function
supabase functions deploy sync-space-stripe
```

### **Problème 3 : Clé Stripe invalide**
**Symptôme :** Erreur Stripe dans les logs
**Solution :**
```bash
# Mettre à jour la clé Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx
```

### **Problème 4 : Service role key invalide**
**Symptôme :** Erreur d'autorisation
**Solution :**
```bash
# Mettre à jour la clé service role
supabase secrets set SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **Problème 5 : Extension pg_net manquante**
**Symptôme :** Erreur "function net.http_post does not exist"
**Solution :**
```sql
-- Activer l'extension
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## 🧪 Test complet

### **Étape 1 : Vérifier l'état actuel**
```sql
-- Vérifier les triggers
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'spaces';

-- Vérifier les fonctions
SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%stripe%';
```

### **Étape 2 : Tester la création**
```sql
-- Créer un espace
INSERT INTO spaces (name, price_per_hour, capacity) VALUES ('Test Final', 25.00, 4);

-- Vérifier le résultat
SELECT * FROM spaces WHERE name = 'Test Final';
```

### **Étape 3 : Vérifier Stripe**
1. Aller sur [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Chercher un produit nommé "Test Final"
3. Vérifier qu'il a un prix de 2500 centimes (25€)

## 📊 Logs à surveiller

### **Logs Edge Function :**
```
[sync-space-stripe] Event reçu : { type: 'INSERT', table: 'spaces' }
[sync-space-stripe] Produit et prix Stripe créés: { product_id: 'prod_xxx', price_id: 'price_xxx' }
```

### **Logs Trigger SQL :**
```
Stripe sync trigger: INSERT on space [ID] (status: 200, response: {"success":true})
```

## 🎯 Actions à effectuer maintenant

1. **Exécuter les vérifications** ci-dessus
2. **Identifier le problème** spécifique
3. **Appliquer la solution** correspondante
4. **Tester à nouveau** la création d'espace

**Dis-moi ce que tu trouves dans chaque vérification et je t'aiderai à résoudre le problème !** 🔧 