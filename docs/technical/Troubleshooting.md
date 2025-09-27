# Guide de dépannage

Ce document présente les problèmes courants rencontrés dans l'application et leurs solutions.

## Problèmes d'authentification

### Symptôme : L'utilisateur ne peut pas se connecter

#### Causes possibles
- Token expiré ou invalide
- Problème de connexion à Supabase
- Erreur dans les identifiants

#### Solutions
1. **Token expiré ou invalide**
   - Effacer le localStorage et se reconnecter
   ```javascript
   localStorage.clear();
   window.location.href = '/auth/login';
   ```
   - Vérifier que la fonction `withRetry` dans `supabaseUtils.ts` fonctionne correctement

2. **Problème de connexion à Supabase**
   - Vérifier que les clés API Supabase sont correctes dans le fichier `.env` ou `env.js`
   - Vérifier que le service Supabase est opérationnel
   - Consulter les logs pour plus d'informations

3. **Erreur dans les identifiants**
   - Vérifier que l'utilisateur existe dans la base de données
   - Réinitialiser le mot de passe si nécessaire

### Symptôme : L'utilisateur est déconnecté automatiquement

#### Causes possibles
- Token de rafraîchissement invalide
- Problème de CORS
- Session expirée

#### Solutions
1. **Token de rafraîchissement invalide**
   - Vérifier la gestion des tokens dans `useAuth.ts`
   - S'assurer que la fonction de rafraîchissement est appelée correctement

2. **Problème de CORS**
   - Vérifier que le domaine de l'application est autorisé dans la configuration de Supabase
   - Vérifier les en-têtes CORS dans les requêtes

3. **Session expirée**
   - Augmenter la durée de vie de la session dans les paramètres de Supabase
   - Implémenter un mécanisme de rafraîchissement automatique de la session

## Problèmes de base de données

### Symptôme : Erreur "column reference 'user_id' is ambiguous"

#### Causes possibles
- Conflit de noms de colonnes dans les requêtes SQL
- Problème dans les politiques RLS

#### Solutions
1. **Conflit de noms de colonnes**
   - Appliquer la migration `20250525000000_fix_user_id_ambiguous.sql`
   - Utiliser des alias de table dans les requêtes SQL

2. **Problème dans les politiques RLS**
   - Vérifier et corriger les politiques RLS dans Supabase
   - Utiliser la migration `20250525000001_disable_rls_admin_settings.sql` comme solution temporaire

### Symptôme : Erreur "permission denied for table X"

#### Causes possibles
- Politiques RLS mal configurées
- Utilisateur sans les droits nécessaires

#### Solutions
1. **Politiques RLS mal configurées**
   - Vérifier les politiques RLS dans Supabase
   - S'assurer que les politiques correspondent aux besoins de l'application

2. **Utilisateur sans les droits nécessaires**
   - Vérifier que l'utilisateur a le rôle approprié
   - Utiliser la fonction `is_admin_v2` pour vérifier les droits d'administrateur

## Problèmes de paiement

### Symptôme : Le paiement échoue

#### Causes possibles
- Clés API Stripe incorrectes
- Webhook Stripe mal configuré
- Problème avec la carte de crédit

#### Solutions
1. **Clés API Stripe incorrectes**
   - Vérifier les clés API dans les paramètres d'administration
   - S'assurer que le mode (test ou live) est correctement configuré

2. **Webhook Stripe mal configuré**
   - Vérifier que le webhook est correctement configuré dans Stripe
   - Vérifier que l'URL du webhook est correcte
   - Vérifier que les événements sont correctement sélectionnés

3. **Problème avec la carte de crédit**
   - Utiliser une carte de test valide en mode test
   - Vérifier les logs Stripe pour plus d'informations sur l'erreur

### Symptôme : La session de paiement n'est pas créée

#### Causes possibles
- Problème avec l'Edge Function `create-payment-session`
- Données de réservation incorrectes

#### Solutions
1. **Problème avec l'Edge Function**
   - Vérifier les logs de l'Edge Function
   - S'assurer que les variables d'environnement sont correctement configurées

2. **Données de réservation incorrectes**
   - Vérifier que les données de réservation sont complètes et valides
   - S'assurer que l'espace et le créneau horaire existent

## Problèmes de performance

### Symptôme : L'application est lente

#### Causes possibles
- Trop de requêtes
- Requêtes inefficaces
- Problèmes de rendu React

#### Solutions
1. **Trop de requêtes**
   - Utiliser le caching avec TanStack Query
   - Optimiser les paramètres `staleTime` et `cacheTime`

2. **Requêtes inefficaces**
   - Optimiser les requêtes SQL
   - Utiliser des index pour les colonnes fréquemment utilisées

3. **Problèmes de rendu React**
   - Utiliser React.memo pour les composants qui ne changent pas souvent
   - Utiliser useMemo et useCallback pour éviter les recalculs inutiles

### Symptôme : Fuites de mémoire

#### Causes possibles
- Abonnements non nettoyés
- Références circulaires
- Closures qui capturent des références

#### Solutions
1. **Abonnements non nettoyés**
   - S'assurer que tous les abonnements sont nettoyés dans useEffect
   ```javascript
   useEffect(() => {
     const subscription = someObservable.subscribe();
     return () => subscription.unsubscribe();
   }, []);
   ```

2. **Références circulaires**
   - Éviter les références circulaires dans les objets
   - Utiliser des WeakMap ou WeakSet si nécessaire

3. **Closures qui capturent des références**
   - Être attentif aux closures qui capturent des références à des objets volumineux
   - Utiliser des références faibles si nécessaire

## Problèmes d'interface utilisateur

### Symptôme : Problèmes d'affichage en mode sombre

#### Causes possibles
- Classes CSS incorrectes
- Thème mal configuré

#### Solutions
1. **Classes CSS incorrectes**
   - Vérifier que les classes dark: sont correctement utilisées
   - S'assurer que les couleurs sont définies pour les deux thèmes

2. **Thème mal configuré**
   - Vérifier la configuration du thème dans tailwind.config.js
   - S'assurer que les couleurs sont correctement définies

### Symptôme : Problèmes d'accessibilité

#### Causes possibles
- Contraste insuffisant
- Éléments non accessibles au clavier
- Attributs ARIA manquants

#### Solutions
1. **Contraste insuffisant**
   - Utiliser des couleurs avec un contraste suffisant
   - Vérifier avec un outil comme axe DevTools

2. **Éléments non accessibles au clavier**
   - S'assurer que tous les éléments interactifs sont accessibles au clavier
   - Ajouter des gestionnaires d'événements pour les touches

3. **Attributs ARIA manquants**
   - Ajouter les attributs ARIA appropriés
   - Utiliser des composants accessibles de la bibliothèque UI

## Problèmes de déploiement

### Symptôme : Erreur 404 sur les routes

#### Causes possibles
- Fichier .htaccess mal configuré
- Module mod_rewrite non activé

#### Solutions
1. **Fichier .htaccess mal configuré**
   - Vérifier que le fichier .htaccess est correctement configuré
   - S'assurer que les règles de réécriture sont correctes

2. **Module mod_rewrite non activé**
   - Activer le module mod_rewrite sur le serveur
   - Contacter le support d'o2switch si nécessaire

### Symptôme : Erreurs CORS

#### Causes possibles
- En-têtes CORS mal configurés
- Domaine non autorisé

#### Solutions
1. **En-têtes CORS mal configurés**
   - Vérifier que les en-têtes CORS sont correctement configurés dans les Edge Functions
   - Ajouter les en-têtes CORS appropriés dans .htaccess

2. **Domaine non autorisé**
   - Ajouter le domaine de l'application dans la liste des domaines autorisés dans Supabase
   - Vérifier que le domaine est correctement configuré dans les Edge Functions

## Problèmes de logging

### Symptôme : Les logs ne sont pas enregistrés

#### Causes possibles
- Edge Function log-collector non déployée
- Table application_logs non créée
- Erreur dans le code de logging

#### Solutions
1. **Edge Function non déployée**
   - Déployer l'Edge Function log-collector
   - Vérifier que l'Edge Function est correctement configurée

2. **Table non créée**
   - Exécuter la migration 20250530000000_add_application_logs.sql
   - Vérifier que la table existe dans Supabase

3. **Erreur dans le code de logging**
   - Vérifier le code dans src/utils/logger.ts
   - S'assurer que les appels à l'Edge Function sont corrects

## Outils de diagnostic

### Console du navigateur
- Ouvrir les outils de développement du navigateur (F12)
- Consulter la console pour les erreurs et les avertissements
- Utiliser l'onglet Réseau pour analyser les requêtes

### Logs Supabase
- Se connecter au tableau de bord Supabase
- Consulter les logs dans l'onglet Database > Logs
- Filtrer les logs par niveau (ERROR, WARNING, etc.)

### Logs Stripe
- Se connecter au tableau de bord Stripe
- Consulter les logs dans l'onglet Développeurs > Logs
- Filtrer les logs par type d'événement

### Logs de l'application
- Se connecter à l'application en tant qu'administrateur
- Consulter les logs dans Administration > Logs
- Filtrer les logs par niveau (error, warn, info, debug)
