# 🧹 Guide de nettoyage des produits Stripe

## 📋 Étape 1 : Identifier les produits à nettoyer

1. **Récupère ta clé secrète Stripe** depuis ton dashboard Stripe
2. **Modifie le script** `get_stripe_products.js` :
   ```javascript
   const STRIPE_SECRET_KEY = 'sk_test_...'; // Remplace par ta vraie clé
   ```
3. **Exécute le script** :
   ```bash
   node get_stripe_products.js
   ```

## 🗑️ Étape 2 : Nettoyer les produits "undefined"

1. **Modifie le script** `cleanup_stripe_products.js` avec ta clé Stripe
2. **Exécute le nettoyage** :
   ```bash
   node cleanup_stripe_products.js
   ```

## ⚠️ Important

- **Sauvegarde** : Les produits supprimés ne peuvent pas être récupérés
- **Vérification** : Le script liste d'abord les produits avant suppression
- **Clé de test** : Utilise `sk_test_...` pour l'environnement de test
- **Clé de production** : Utilise `sk_live_...` pour la production

## 🔄 Après le nettoyage

1. **Relance la synchronisation** via l'interface admin
2. **Vérifie** que les nouveaux produits sont correctement créés
3. **Teste** la création de réservations

## 📊 Scripts disponibles

- `get_stripe_products.js` : Liste tous les produits
- `cleanup_stripe_products.js` : Supprime les produits "undefined"
- `cleanup_and_retest_final.sql` : Nettoie la file d'attente et relance la sync 