# 🔄 Synchronisation Automatique Stripe - Système Complet

## 📋 Vue d'ensemble

Le système de synchronisation automatique Stripe permet de maintenir les produits et prix Stripe synchronisés avec la table `spaces` de la base de données. Chaque modification (création, mise à jour, suppression) d'un espace déclenche automatiquement la synchronisation avec Stripe.

## 🏗️ Architecture

### 1. **Trigger SQL** (`sync_space_with_stripe`)
- **Localisation** : `supabase/migrations/20250705000001_create_stripe_sync_trigger.sql`
- **Fonction** : Capture les events INSERT/UPDATE/DELETE sur la table `spaces`
- **Action** : Appelle l'edge function via HTTP POST

### 2. **Edge Function** (`sync-space-stripe`)
- **Localisation** : `supabase/functions/sync-space-stripe/index.ts`
- **Fonction** : Traite les events et synchronise avec Stripe
- **Déploiement** : ✅ Déployé et actif

## 🔧 Configuration

### Secrets Supabase configurés :
```bash
# Clé Stripe (test ou live)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxx

# Clé service role Supabase
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variables d'environnement :
- `SUPABASE_URL` : https://exffryodynkyizbeesbt.supabase.co
- `SERVICE_ROLE_KEY` : Clé service role pour les opérations admin

## 🚀 Fonctionnalités

### ✅ INSERT (Création d'espace)
1. **Création produit Stripe** avec métadonnées :
   - `space_id` : ID de l'espace
   - `capacity` : Capacité
   - `type` : 'coworking_space'

2. **Création prix Stripe** :
   - Montant : `price_per_hour * 100` (centimes)
   - Devise : EUR
   - Type : Prix unique (pas d'abonnement)

3. **Mise à jour espace** avec les IDs Stripe :
   - `stripe_product_id`
   - `stripe_price_id`

### ✅ UPDATE (Modification d'espace)
1. **Mise à jour produit existant** si `stripe_product_id` présent
2. **Création nouveau produit** si pas d'ID existant
3. **Création nouveau prix** si `price_per_hour` modifié
4. **Mise à jour espace** avec les nouveaux IDs

### ✅ DELETE (Suppression d'espace)
1. **Archivage produit Stripe** (pas de suppression définitive)
2. **Préservation historique** des transactions

## 📊 Logs et Monitoring

### Logs Edge Function :
```javascript
[sync-space-stripe] Event reçu : { type: 'INSERT', table: 'spaces', record: {...} }
[sync-space-stripe] Produit et prix Stripe créés: { product_id: 'prod_xxx', price_id: 'price_xxx' }
```

### Logs Trigger SQL :
```sql
Stripe sync trigger: INSERT on space 123 (status: 200, response: {"success":true})
```

## 🧪 Test du système

### 1. Test de création d'espace :
```sql
INSERT INTO spaces (name, description, capacity, price_per_hour, is_active) 
VALUES ('Test Space', 'Espace de test pour Stripe', 10, 25.00, true);
```

### 2. Test de modification :
```sql
UPDATE spaces 
SET price_per_hour = 30.00, name = 'Test Space Updated' 
WHERE name = 'Test Space';
```

### 3. Test de suppression :
```sql
DELETE FROM spaces WHERE name = 'Test Space Updated';
```

## 🔍 Vérification

### Dans Stripe Dashboard :
1. **Produits** : Nouveaux produits créés avec métadonnées
2. **Prix** : Prix correspondants en EUR
3. **Archivage** : Produits désactivés (pas supprimés)

### Dans Supabase :
1. **Table spaces** : Colonnes `stripe_product_id` et `stripe_price_id` remplies
2. **Logs** : Vérification des logs dans le dashboard Supabase

## 🛡️ Sécurité

### ✅ Bonnes pratiques implémentées :
- **Clés secrètes** stockées dans les secrets Supabase
- **Service role key** pour les opérations admin
- **Gestion d'erreurs** robuste avec logs
- **Archivage** au lieu de suppression définitive
- **Validation** des données avant traitement

### 🔒 Variables sensibles :
- `STRIPE_SECRET_KEY` : Jamais exposée côté client
- `SERVICE_ROLE_KEY` : Utilisée uniquement dans l'edge function
- **URLs** : Configurées en dur pour éviter les injections

## 📈 Performance

### Optimisations :
- **Appels HTTP** asynchrones
- **Gestion d'erreurs** non-bloquante
- **Logs structurés** pour le debugging
- **Métadonnées** pour le tracking

### Monitoring :
- **Status codes** HTTP retournés
- **Temps de réponse** loggés
- **Erreurs** capturées et loggées

## 🔄 Workflow complet

```
1. Admin crée/modifie/supprime un espace
   ↓
2. Trigger SQL détecte l'event
   ↓
3. Appel HTTP à l'edge function
   ↓
4. Edge function traite l'event
   ↓
5. Synchronisation avec Stripe
   ↓
6. Mise à jour de la base de données
   ↓
7. Logs de confirmation
```

## ✅ État actuel

- **Edge function** : ✅ Déployée et configurée
- **Trigger SQL** : ✅ Créé et actif
- **Secrets** : ✅ Configurés
- **Tests** : ✅ Prêt pour validation
- **Documentation** : ✅ Complète

## 🎯 Prochaines étapes

1. **Tester** la création d'un espace via l'interface admin
2. **Vérifier** la synchronisation dans Stripe Dashboard
3. **Monitorer** les logs pour détecter d'éventuelles erreurs
4. **Optimiser** si nécessaire selon les retours

---

**Le système de synchronisation automatique Stripe est maintenant opérationnel et prêt à être utilisé !** 🚀 