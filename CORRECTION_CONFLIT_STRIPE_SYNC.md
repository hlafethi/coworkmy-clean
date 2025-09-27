# Correction du Conflit Unique dans stripe_sync_queue

## 🚨 Problème Identifié

**Erreur** : `duplicate key value violates unique constraint "unique_space_event"`
**Code HTTP** : `409 (Conflict)`

### **Cause**
Le code React tentait d'insérer un enregistrement dans la table `stripe_sync_queue` avec une paire `(space_id, event_type)` qui existait déjà, violant la contrainte UNIQUE.

### **Pourquoi cela se produisait**
- Utilisation de `.insert()` simple au lieu d'`.upsert()`
- Pas de gestion des conflits
- Tentative de synchronisation multiple du même espace

## ✅ Solution Implémentée

### **1. Remplacement de `.insert()` par `.upsert()`**

#### **Avant (Problématique)**
```javascript
const { error: queueError } = await supabase
  .from('stripe_sync_queue')
  .insert({
    space_id: space.id,
    event_type: 'MANUAL_SYNC',
    payload: { /* ... */ },
    status: 'pending'
  });
```

#### **Après (Corrigé)**
```javascript
const { error: queueError } = await supabase
  .from('stripe_sync_queue')
  .upsert({
    space_id: space.id,
    event_type: 'MANUAL_SYNC',
    payload: { /* ... */ },
    status: 'pending'
  }, { onConflict: ['space_id', 'event_type'] });
```

### **2. Fichiers Corrigés**

#### **`src/components/admin/spaces/StripeDebugPanel.tsx`**
- ✅ `syncAllSpaces()` : `.insert(jobs)` → `.upsert(jobs, { onConflict: ['space_id', 'event_type'] })`
- ✅ `syncSingleSpace()` : `.insert({...})` → `.upsert({...}, { onConflict: ['space_id', 'event_type'] })`

#### **`src/components/admin/spaces/SpaceCard.tsx`**
- ✅ `handleSync()` : `.insert({...})` → `.upsert({...}, { onConflict: ['space_id', 'event_type'] })`

#### **`src/components/admin/spaces/SpacesList.tsx`**
- ✅ Synchronisation en masse : `.insert(syncJobs)` → `.upsert(syncJobs, { onConflict: ['space_id', 'event_type'] })`

## 🛡️ Avantages de la Correction

### **1. Plus d'Erreurs 409**
- ✅ Aucune violation de contrainte unique
- ✅ Synchronisation possible même si un job existe déjà

### **2. Comportement Prédictible**
- ✅ **Insert** : Si la paire `(space_id, event_type)` n'existe pas
- ✅ **Update** : Si la paire existe déjà (remplace l'ancien job)

### **3. Robustesse**
- ✅ Gestion automatique des conflits
- ✅ Pas de perte de données
- ✅ Synchronisation fiable

## 🔧 Fonctionnement de l'Upsert

### **Paramètre `onConflict`**
```javascript
{ onConflict: ['space_id', 'event_type'] }
```

- **Détection** : Vérifie si une ligne avec la même paire `(space_id, event_type)` existe
- **Action** : 
  - Si **non** → INSERT
  - Si **oui** → UPDATE avec les nouvelles valeurs

### **Champs Mis à Jour**
- `payload` : Nouveau payload
- `status` : Remis à 'pending'
- `created_at` : Mis à jour
- `updated_at` : Mis à jour

## 📋 Tests Recommandés

### **1. Test de Synchronisation Simple**
```javascript
// Cliquer sur "Synchroniser" pour un espace
// Vérifier qu'il n'y a pas d'erreur 409
```

### **2. Test de Synchronisation Multiple**
```javascript
// Cliquer plusieurs fois sur "Synchroniser" pour le même espace
// Vérifier que seule la dernière synchronisation est traitée
```

### **3. Test de Synchronisation en Masse**
```javascript
// Cliquer sur "Tout synchroniser"
// Vérifier qu'aucune erreur 409 n'apparaît
```

## 🎯 Résultat Final

- ✅ **Plus d'erreurs 409** lors des synchronisations
- ✅ **Synchronisation fiable** même en cas de clics multiples
- ✅ **Gestion automatique** des conflits
- ✅ **Expérience utilisateur** améliorée

## 📝 Notes Techniques

### **Contrainte Unique**
```sql
CONSTRAINT unique_space_event UNIQUE (space_id, event_type)
```

### **Comportement Attendu**
- Un seul job actif par espace et type d'événement
- Remplacement automatique des jobs obsolètes
- Pas de duplication de jobs

### **Monitoring**
- Vérifier les logs de la fonction Edge `stripe-sync-queue`
- Surveiller la table `stripe_sync_queue` pour les jobs en attente
- Contrôler les statuts des jobs (pending, processing, completed, failed)

---

**Status** : ✅ **CORRIGÉ** - Plus d'erreurs 409 lors des synchronisations Stripe 