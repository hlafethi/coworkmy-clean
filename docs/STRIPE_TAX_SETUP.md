# Guide de Configuration Stripe Tax

## 🎯 Objectif
Ce guide explique comment activer et configurer le calcul automatique des taxes Stripe pour assurer la conformité fiscale européenne et française.

## 📋 Prérequis
- Compte Stripe actif
- Accès au Dashboard Stripe
- Activé pour les paiements européens

## 🚀 Étapes de Configuration

### 1. Activation de Stripe Tax

1. **Accéder au Dashboard Stripe**
   - Connecte-toi à [dashboard.stripe.com](https://dashboard.stripe.com)
   - Va dans la section **Taxes** (dans le menu de gauche)

2. **Activer Stripe Tax**
   - Clique sur **"Activer Stripe Tax"**
   - Accepte les conditions d'utilisation
   - Configure ton entreprise avec les informations fiscales

### 2. Configuration de l'Entreprise

1. **Informations de base**
   - Nom de l'entreprise : Canard Cowork Space
   - Adresse : [Ton adresse complète]
   - Pays : France
   - Numéro de TVA : [Ton numéro de TVA si applicable]

2. **Régions de facturation**
   - Active l'Europe (UE)
   - Configure les taux de TVA par pays si nécessaire

### 3. Configuration des Produits

1. **Définir la nature des services**
   - Type : Services de coworking
   - Catégorie fiscale : Services professionnels
   - Taux de TVA applicable : 20% (France)

2. **Configuration des prix**
   - Les prix sont-ils HT ou TTC ? → **HT** (exclusive)
   - Stripe calculera automatiquement la TVA

### 4. Test de la Configuration

1. **Créer une session de test**
   - Utilise le mode test de Stripe
   - Crée une réservation avec une adresse française
   - Vérifie que la TVA (20%) est bien calculée

2. **Vérifier les factures**
   - Les factures doivent inclure :
     - Montant HT
     - Montant de la TVA
     - Montant TTC
     - Numéro de TVA de l'entreprise

## 🔧 Configuration Technique

### Dans le Code (Déjà implémenté)

```typescript
// Dans create-payment-session
const session = await stripe.checkout.sessions.create({
  // ... autres paramètres
  automatic_tax: { enabled: true },
  tax_id_collection: { enabled: true },
});
```

### Variables d'Environnement

```bash
# .env.local
REACT_APP_STRIPE_TAX_ENABLED=true
```

## 📊 Monitoring et Reporting

### 1. Dashboard Stripe
- **Section Taxes** : Vue d'ensemble des taxes collectées
- **Rapports** : Export des données fiscales
- **Déclarations** : Génération automatique des déclarations

### 2. Logs de l'Application
```typescript
// Les logs incluent maintenant les informations de taxes
console.log('[Stripe Tax] Session créée avec taxes automatiques');
```

## 🧪 Tests et Validation

### Test 1 : Client Français
- Adresse française
- TVA 20% appliquée automatiquement
- Facture conforme

### Test 2 : Client UE
- Adresse d'un autre pays UE
- TVA du pays de destination
- Conformité avec les règles de TVA UE

### Test 3 : Client Hors UE
- Pas de TVA appliquée
- Facture d'export

## ⚠️ Points d'Attention

### 1. Conformité Fiscale
- Vérifie que ton numéro de TVA est correct
- Assure-toi que les taux de TVA sont à jour
- Conserve les factures pendant 10 ans

### 2. Gestion des Erreurs
```typescript
// Gestion des erreurs de calcul de taxes
if (error?.code === 'tax_calculation_failed') {
  // Afficher un message d'erreur approprié
}
```

### 3. Performance
- Le calcul automatique ajoute ~100-200ms au temps de réponse
- Acceptable pour l'expérience utilisateur

## 📈 Avantages

### Pour l'Entreprise
- ✅ Conformité fiscale automatique
- ✅ Réduction des erreurs de calcul
- ✅ Factures professionnelles
- ✅ Reporting fiscal automatisé

### Pour les Clients
- ✅ Transparence des prix
- ✅ Factures claires et conformes
- ✅ Pas de surprise sur les taxes

## 🔄 Maintenance

### Mises à jour
- Vérifie régulièrement les taux de TVA
- Surveille les changements de réglementation
- Met à jour les informations de l'entreprise si nécessaire

### Support
- Documentation Stripe : [stripe.com/docs/tax](https://stripe.com/docs/tax)
- Support Stripe : Via le dashboard
- Contact fiscal : Ton expert-comptable

## ✅ Checklist de Validation

- [ ] Stripe Tax activé dans le dashboard
- [ ] Informations de l'entreprise configurées
- [ ] Régions de facturation définies
- [ ] Tests effectués avec différents pays
- [ ] Factures générées correctement
- [ ] Logs de l'application vérifiés
- [ ] Documentation mise à jour

## 🎉 Résultat Final

Une fois configuré, Stripe calculera automatiquement :
- La TVA française (20%) pour les clients français
- La TVA appropriée pour les clients UE
- Aucune TVA pour les clients hors UE
- Génération de factures conformes
- Reporting fiscal automatisé

**Ton application est maintenant conforme aux réglementations fiscales européennes !** 🚀 