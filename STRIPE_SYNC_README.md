# Synchronisation Automatique Stripe

## Vue d'ensemble

Ce système permet la synchronisation automatique des espaces de coworking avec le catalogue Stripe. Chaque fois qu'un espace est créé ou modifié dans l'application, il est automatiquement ajouté ou mis à jour dans Stripe.

## Fonctionnalités

### ✅ Synchronisation Automatique
- **Création d'espace** : Nouvel espace automatiquement ajouté au catalogue Stripe
- **Modification d'espace** : Mise à jour automatique du produit Stripe existant
- **Gestion des prix** : Création de nouveaux prix Stripe avec désactivation des anciens
- **Métadonnées** : Synchronisation des informations détaillées (capacité, type de tarification, etc.)

### ✅ Interface Utilisateur
- **Notification automatique** : Toast de confirmation après synchronisation
- **Gestion d'erreurs** : Messages d'erreur clairs en cas de problème
- **Indicateur visuel** : Information dans le formulaire de création d'espace

### ✅ Fonctions Supabase Edge
- **`create-stripe-catalog`** : Synchronisation complète de tous les espaces
- **`sync-space-stripe`** : Synchronisation d'un espace individuel
- **Sécurité** : Vérification des permissions administrateur

## Installation

### 1. Déployer les Fonctions Edge

```bash
# Rendre le script exécutable
chmod +x deploy-stripe-functions.sh

# Exécuter le déploiement
./deploy-stripe-functions.sh
```

### 2. Appliquer la Migration SQL

Exécuter la migration `supabase/migrations/20250702000001_add_stripe_sync_trigger.sql` dans votre base de données Supabase.

### 3. Configurer les Variables d'Environnement

Dans votre projet Supabase, ajouter les variables suivantes :

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Utilisation

### Synchronisation Automatique

1. **Créer un nouvel espace** dans l'interface d'administration
2. **Remplir les informations** (nom, description, prix, etc.)
3. **Sauvegarder** - La synchronisation Stripe se fait automatiquement
4. **Confirmation** - Toast de succès indiquant la synchronisation

### Synchronisation Manuelle

#### Via l'Interface
- Bouton "Synchroniser avec Stripe" dans la liste des espaces
- Synchronise tous les espaces actifs

#### Via l'API
```javascript
// Synchroniser un espace spécifique
const { data, error } = await supabase.rpc('sync_space_with_stripe', {
  space_id: 'uuid-de-lespace'
});
```

## Structure des Données

### Produit Stripe
```json
{
  "name": "Nom de l'espace",
  "description": "Description de l'espace",
  "images": ["URL de l'image"],
  "metadata": {
    "external_id": "UUID Supabase",
    "capacity": "10",
    "pricing_type": "hourly",
    "main_price": "25.00"
  }
}
```

### Prix Stripe
```json
{
  "product": "prod_...",
  "unit_amount": 2500, // 25.00 EUR en centimes
  "currency": "eur",
  "metadata": {
    "space_id": "UUID Supabase",
    "pricing_type": "hourly"
  }
}
```

## Gestion des Erreurs

### Erreurs Courantes

1. **Clés Stripe manquantes**
   - Vérifier les variables d'environnement
   - Redéployer les fonctions

2. **Permissions insuffisantes**
   - Vérifier le statut administrateur
   - Contrôler les politiques RLS

3. **Prix invalide**
   - Vérifier que le prix principal > 0
   - Contrôler le type de tarification

### Logs

Les logs de synchronisation sont disponibles dans :
- **Console Supabase** : Logs des fonctions Edge
- **Table `application_logs`** : Historique des synchronisations

## Tests

### Test de Création
1. Créer un nouvel espace avec prix
2. Vérifier l'apparition dans le dashboard Stripe
3. Contrôler les métadonnées et prix

### Test de Modification
1. Modifier un espace existant
2. Vérifier la mise à jour dans Stripe
3. Contrôler la désactivation des anciens prix

### Test d'Erreur
1. Créer un espace sans prix
2. Vérifier le message d'erreur approprié
3. Contrôler que l'espace est quand même créé

## Maintenance

### Nettoyage
- Les anciens prix Stripe sont automatiquement désactivés
- Les produits orphelins peuvent être nettoyés manuellement

### Monitoring
- Surveiller les logs de synchronisation
- Vérifier régulièrement la cohérence des données
- Contrôler les erreurs dans le dashboard Stripe

## Support

En cas de problème :
1. Vérifier les logs Supabase
2. Contrôler les variables d'environnement
3. Tester la synchronisation manuelle
4. Consulter la documentation Stripe API 