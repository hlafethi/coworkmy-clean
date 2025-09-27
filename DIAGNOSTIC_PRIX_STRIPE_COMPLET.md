# Diagnostic Complet - Prix Stripe Non Transmis

## 🎯 Problème Identifié

L'espace "🟥 Le Cocoon – Au mois" affiche bien 360€/mois dans l'application, mais la synchronisation Stripe échoue avec :
```
Error: Prix invalide pour undefined: 0 EUR (mensuel). Le prix doit être supérieur à 0.
```

## 🔍 Diagnostic Technique

### 1. **Vérification de la Base de Données**

Exécuter ce script SQL dans l'interface Supabase :

```sql
-- Vérifier la structure de l'espace dans la table spaces
SELECT 
  id,
  name,
  pricing_type,
  hourly_price,
  daily_price,
  half_day_price,
  monthly_price,
  quarter_price,
  yearly_price,
  custom_price,
  stripe_product_id,
  stripe_price_id
FROM spaces 
WHERE id = 'bd14a96d-3ec5-4602-a4f0-bb40fc7b6abc';
```

**Résultat attendu** : `monthly_price` doit être `360` ou la valeur correcte.

### 2. **Vérification du Payload Transmis**

Exécuter ce script pour voir le payload réel :

```sql
-- Vérifier les jobs récents pour cet espace
SELECT 
  id,
  space_id,
  event_type,
  status,
  created_at,
  payload
FROM stripe_sync_queue 
WHERE space_id = 'bd14a96d-3ec5-4602-a4f0-bb40fc7b6abc'
ORDER BY created_at DESC
LIMIT 1;
```

**Vérifier** : Le champ `monthly_price` dans le JSONB doit être présent et égal à `360`.

### 3. **Test du Trigger**

Créer un job de test pour vérifier le trigger :

```sql
-- Créer un job de test
INSERT INTO stripe_sync_queue (space_id, event_type, payload)
SELECT 
  id,
  'TEST',
  jsonb_build_object(
    'id', id,
    'name', name,
    'description', NULLIF(description, ''),
    'pricing_type', pricing_type,
    'hourly_price', hourly_price,
    'daily_price', daily_price,
    'half_day_price', half_day_price,
    'monthly_price', monthly_price,
    'quarter_price', quarter_price,
    'yearly_price', yearly_price,
    'custom_price', custom_price,
    'stripe_product_id', stripe_product_id,
    'stripe_price_id', stripe_price_id
  )
FROM spaces 
WHERE id = 'bd14a96d-3ec5-4602-a4f0-bb40fc7b6abc';
```

## 📊 Logs de Diagnostic

Après avoir déclenché une synchronisation, les logs doivent afficher :

### ✅ Logs Attendus (Succès)
```
🔍 Payload du job: {
  "id": "bd14a96d-3ec5-4602-a4f0-bb40fc7b6abc",
  "name": "🟥 Le Cocoon – Au mois",
  "pricing_type": "monthly",
  "monthly_price": 360,
  ...
}
🔍 DIAGNOSTIC PRIX MENSUEL:
  - payload.monthly_price (brut): 360
  - typeof payload.monthly_price: number
  - space.monthly_price (traité): 360
  - pricing_type: monthly
💰 SÉLECTION DU PRIX POUR 🟥 Le Cocoon – Au mois:
  - Type de tarification: monthly
  - Prix mensuel: 360 EUR
💰 Prix mensuel sélectionné pour 🟥 Le Cocoon – Au mois: 360 EUR
```

### ❌ Logs Problématiques
```
🔍 DIAGNOSTIC PRIX MENSUEL:
  - payload.monthly_price (brut): null
  - typeof payload.monthly_price: object
  - space.monthly_price (traité): 0
  - pricing_type: monthly
```

## 🚨 Causes Possibles

### 1. **Champ Absent du Trigger**
Le trigger ne transmet pas le champ `monthly_price`.

**Solution** : Vérifier que le trigger contient bien :
```sql
'monthly_price', NEW.monthly_price
```

### 2. **Valeur NULL dans la Base**
Le champ `monthly_price` est NULL dans la table `spaces`.

**Solution** : Mettre à jour l'espace :
```sql
UPDATE spaces 
SET monthly_price = 360 
WHERE id = 'bd14a96d-3ec5-4602-a4f0-bb40fc7b6abc';
```

### 3. **Type de Données Incorrect**
Le champ est transmis comme string au lieu de number.

**Solution** : Vérifier le type dans le trigger :
```sql
'monthly_price', COALESCE(NEW.monthly_price, 0)
```

### 4. **Problème de Cache**
L'application affiche une valeur en cache.

**Solution** : Recharger la page et vérifier la base de données.

## 🔧 Corrections à Appliquer

### 1. **Mettre à Jour l'Espace**
```sql
UPDATE spaces 
SET monthly_price = 360 
WHERE id = 'bd14a96d-3ec5-4602-a4f0-bb40fc7b6abc';
```

### 2. **Vérifier le Trigger**
Exécuter le script `create_optimized_stripe_trigger.sql` pour s'assurer que le trigger est correct.

### 3. **Tester la Synchronisation**
- Aller dans Admin > Espaces
- Modifier l'espace "🟥 Le Cocoon – Au mois"
- Sauvegarder pour déclencher la synchronisation
- Vérifier les logs dans la console Supabase

## 🎯 Résultat Attendu

Après ces corrections :
- ✅ **Prix correct** dans la base de données (360)
- ✅ **Payload complet** avec monthly_price = 360
- ✅ **Logs détaillés** montrant la valeur correcte
- ✅ **Synchronisation réussie** avec Stripe

## 📋 Checklist de Diagnostic

- [ ] Vérifier la valeur dans la table `spaces`
- [ ] Vérifier le payload dans `stripe_sync_queue`
- [ ] Vérifier les logs de la fonction Edge
- [ ] Tester le trigger avec un job de test
- [ ] Corriger la valeur si nécessaire
- [ ] Redéclencher la synchronisation
- [ ] Vérifier le succès dans les logs

**Une fois le diagnostic effectué, nous saurons exactement pourquoi le prix n'est pas transmis !** 🔍 