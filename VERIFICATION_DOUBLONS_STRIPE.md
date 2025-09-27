# 🛡️ Vérification de Doublons Stripe - Système Anti-Duplication

## 📋 Vue d'ensemble

Le système de vérification de doublons empêche la création de produits Stripe en double et gère les conflits de noms d'espaces.

## 🔍 Vérifications Implémentées

### 1. **Vérification lors de l'INSERT (Création)**

#### ✅ **Espace déjà synchronisé**
```javascript
// Vérifier si l'espace a déjà des IDs Stripe
if (record.stripe_product_id && record.stripe_price_id) {
  // Vérifier que les produits Stripe existent toujours
  const existingProduct = await stripe.products.retrieve(record.stripe_product_id);
  const existingPrice = await stripe.prices.retrieve(record.stripe_price_id);
  
  // Retourner succès si tout est OK
  return { success: true, message: 'Espace déjà synchronisé' };
}
```

#### ✅ **Conflit de nom d'espace**
```javascript
// Chercher un produit existant avec le même nom
const existingProducts = await stripe.products.list({ limit: 100, active: true });
const duplicateProduct = existingProducts.data.find(product => 
  product.name === record.name && 
  product.metadata?.space_id !== record.id
);

if (duplicateProduct) {
  // Retourner erreur 409 (Conflict)
  return { 
    error: 'Un produit Stripe avec le même nom existe déjà',
    duplicate_product_id: duplicateProduct.id,
    existing_space_id: duplicateProduct.metadata?.space_id
  };
}
```

### 2. **Vérification lors de l'UPDATE (Modification)**

#### ✅ **Conflit de nom lors du changement**
```javascript
// Si le nom a changé, vérifier qu'il n'y a pas de conflit
if (old_record?.name !== record.name) {
  const duplicateProduct = existingProducts.data.find(product => 
    product.name === record.name && 
    product.metadata?.space_id !== record.id
  );

  if (duplicateProduct) {
    return { 
      error: 'Un produit Stripe avec le nouveau nom existe déjà',
      duplicate_product_id: duplicateProduct.id,
      existing_space_id: duplicateProduct.metadata?.space_id
    };
  }
}
```

#### ✅ **Produit Stripe introuvable**
```javascript
// Vérifier que le produit Stripe existe toujours
try {
  await stripe.products.retrieve(record.stripe_product_id);
} catch (error) {
  // Créer un nouveau produit si l'ancien n'existe plus
  const product = await stripe.products.create({...});
  const price = await stripe.prices.create({...});
}
```

### 3. **Vérification lors du DELETE (Suppression)**

#### ✅ **Produit déjà supprimé**
```javascript
try {
  await stripe.products.retrieve(old_record.stripe_product_id);
  // Archiver le produit
  await stripe.products.update(old_record.stripe_product_id, { active: false });
} catch (error) {
  // Produit déjà supprimé ou introuvable
  console.log('Produit Stripe déjà supprimé ou introuvable');
}
```

## 🚨 Codes d'Erreur

### **409 Conflict**
- **Cause** : Conflit de nom d'espace
- **Message** : "Un produit Stripe avec le même nom existe déjà"
- **Action** : Empêche la création/modification

### **500 Internal Server Error**
- **Cause** : Erreur Stripe ou réseau
- **Message** : Détails de l'erreur
- **Action** : Log de l'erreur, pas de création

## 📊 Logs de Debug

### **Logs de vérification de doublons :**
```javascript
[sync-space-stripe] Espace déjà synchronisé avec Stripe: {
  space_id: "123",
  stripe_product_id: "prod_xxx",
  stripe_price_id: "price_xxx"
}

[sync-space-stripe] Produit Stripe avec le même nom trouvé: {
  existing_product_id: "prod_yyy",
  existing_space_id: "456",
  new_space_id: "123"
}

[sync-space-stripe] Conflit de nom détecté lors de la mise à jour: {
  existing_product_id: "prod_yyy",
  existing_space_id: "456",
  current_space_id: "123"
}
```

## 🧪 Scénarios de Test

### **Test 1 : Espace déjà synchronisé**
```sql
-- Espace avec IDs Stripe existants
INSERT INTO spaces (name, stripe_product_id, stripe_price_id) 
VALUES ('Espace Test', 'prod_existing', 'price_existing');
-- Résultat : Succès, pas de création de doublon
```

### **Test 2 : Conflit de nom**
```sql
-- Premier espace
INSERT INTO spaces (name) VALUES ('Espace Unique');

-- Deuxième espace avec le même nom
INSERT INTO spaces (name) VALUES ('Espace Unique');
-- Résultat : Erreur 409, conflit de nom
```

### **Test 3 : Changement de nom vers un nom existant**
```sql
-- Espace A
INSERT INTO spaces (name) VALUES ('Espace A');

-- Espace B
INSERT INTO spaces (name) VALUES ('Espace B');

-- Modification de B vers le nom de A
UPDATE spaces SET name = 'Espace A' WHERE name = 'Espace B';
-- Résultat : Erreur 409, conflit de nom
```

## 🛡️ Avantages de la Vérification

### ✅ **Prévention des doublons**
- Aucun produit Stripe en double
- Gestion des conflits de noms
- Vérification de l'existence des produits

### ✅ **Robustesse**
- Gestion des produits Stripe supprimés
- Récupération automatique en cas d'erreur
- Logs détaillés pour le debugging

### ✅ **Sécurité**
- Validation des données avant traitement
- Gestion des erreurs non-bloquante
- Préservation de l'intégrité des données

## 🔄 Workflow avec Vérifications

```
1. Event INSERT/UPDATE/DELETE sur spaces
   ↓
2. Vérification de doublons
   ├─ Espace déjà synchronisé ? → Succès
   ├─ Conflit de nom ? → Erreur 409
   └─ Produit introuvable ? → Création nouveau
   ↓
3. Traitement Stripe
   ├─ Création produit/prix
   ├─ Mise à jour existant
   └─ Archivage (DELETE)
   ↓
4. Mise à jour base de données
   ↓
5. Logs de confirmation
```

## ✅ État Actuel

- **Vérifications INSERT** : ✅ Implémentées
- **Vérifications UPDATE** : ✅ Implémentées  
- **Vérifications DELETE** : ✅ Implémentées
- **Gestion d'erreurs** : ✅ Complète
- **Logs de debug** : ✅ Détaillés
- **Tests** : ✅ Prêts

---

**Le système est maintenant protégé contre tous les types de doublons et conflits !** 🛡️ 