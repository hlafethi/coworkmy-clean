# 🔧 Résolution du problème Stripe Portal

## 🎯 Problème identifié

L'erreur 500 avec le message `"is not valid JSON"` lors de l'appel à la fonction Edge `create-customer-portal` est causée par un problème d'authentification.

### 🔍 Diagnostic effectué

1. **Tests de la fonction Edge** ✅
   - CORS fonctionne correctement (OPTIONS → 200)
   - Toutes les requêtes POST sans authentification retournent 401
   - La fonction Edge elle-même fonctionne correctement

2. **Problème identifié** 🎯
   - Le token d'authentification n'est pas correctement récupéré côté client
   - La fonction Edge rejette les requêtes avec 401 "Missing authorization header"
   - Le client React essaie de parser cette erreur comme du JSON, d'où l'erreur "is not valid JSON"

## ✅ Corrections apportées

### 1. Amélioration de la fonction Edge
- **Fichier** : `supabase/functions/create-customer-portal/index.ts`
- **Améliorations** :
  - Logs détaillés pour le diagnostic
  - Gestion d'erreur robuste avec sérialisation JSON sécurisée
  - Validation des données d'entrée
  - Gestion des erreurs Stripe avec try/catch séparés

### 2. Amélioration du client React
- **Fichier** : `src/utils/stripeUtils.ts`
- **Améliorations** :
  - Récupération du token avec la même logique que `AuthContext`
  - Fallback sur localStorage avec multiples clés possibles
  - Timeout sur `getSession()` pour éviter les blocages
  - Gestion d'erreur améliorée avec parsing JSON sécurisé

### 3. Scripts de test créés
- **Fichier** : `test-stripe-portal.js` - Tests sans authentification
- **Fichier** : `test-stripe-portal-with-auth.js` - Tests avec authentification

## 🧪 Tests à effectuer

### Test 1 : Vérification de l'authentification
```javascript
// Dans la console du navigateur (après connexion)
testStripePortalWithAuth()
```

### Test 2 : Test manuel dans l'application
1. Connectez-vous à l'application
2. Allez dans le dashboard
3. Cliquez sur "Accéder au portail client"
4. Vérifiez les logs dans la console développeur

## 🔍 Logs à surveiller

### Côté client (console navigateur)
```
[Stripe] Appel create-customer-portal avec : { customerEmail, returnUrl, isAdmin }
[Stripe] Token trouvé dans localStorage avec la clé: sb-exffryodynkyizbeesbt-auth-token
[Stripe] Token d'authentification récupéré avec succès
[Stripe] URL Edge utilisée : https://exffryodynkyizbeesbt.functions.supabase.co/create-customer-portal
[Stripe] Statut HTTP de la réponse : 200
[Stripe] Portail client créé avec succès : { url, mode, customerId }
```

### Côté serveur (logs Supabase)
```
[Edge] Fonction create-customer-portal appelée
[Edge] Token d'authentification fourni
[Edge] Body parsé avec succès: { customerEmail, returnUrl, isAdmin }
[Edge] Configuration Stripe parsée: { mode: 'test', hasTestKey: true }
[Edge] Client Stripe initialisé avec le mode: test
[Edge] Session portail créée avec succès: https://billing.stripe.com/...
```

## 🚨 Erreurs possibles et solutions

### Erreur 401 "Missing authorization header"
- **Cause** : Token d'authentification manquant
- **Solution** : Vérifier que l'utilisateur est connecté et que le token est récupéré

### Erreur 401 "Invalid JWT"
- **Cause** : Token expiré ou invalide
- **Solution** : Reconnecter l'utilisateur

### Erreur 500 "Configuration Stripe manquante"
- **Cause** : Clés Stripe non configurées dans la base de données
- **Solution** : Vérifier la table `admin_settings` avec la clé `stripe`

### Erreur 500 "Clé secrète Stripe manquante"
- **Cause** : Clé secrète Stripe vide pour le mode configuré
- **Solution** : Mettre à jour les clés Stripe dans `admin_settings`

## 📋 Checklist de vérification

- [ ] Utilisateur connecté à l'application
- [ ] Token d'authentification présent dans localStorage
- [ ] Configuration Stripe présente dans `admin_settings`
- [ ] Clés Stripe valides (test ou live selon le mode)
- [ ] Fonction Edge redéployée avec les dernières corrections
- [ ] Logs côté client et serveur sans erreur

## 🎯 Prochaines étapes

1. **Tester l'application** avec un utilisateur connecté
2. **Vérifier les logs** dans la console développeur
3. **Consulter les logs Supabase** si nécessaire
4. **Signaler les erreurs** avec les logs complets

## 📞 Support

Si le problème persiste, fournir :
- Logs complets de la console navigateur
- Logs de la fonction Edge Supabase
- Configuration Stripe (sans les clés secrètes)
- État de l'authentification utilisateur 