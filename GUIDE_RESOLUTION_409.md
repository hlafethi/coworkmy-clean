# 🚨 Guide de Résolution - Erreur 409 Restante

## 📋 **Diagnostic Initial**

### **Étape 1 : Identifier l'espace problématique**

Exécute cette requête dans Supabase SQL Editor :

```sql
-- Voir tous les espaces avec des jobs en attente
SELECT 
    s.id as space_id,
    s.name as space_name,
    ssq.id as queue_id,
    ssq.event_type,
    ssq.status,
    ssq.created_at
FROM public.spaces s
JOIN public.stripe_sync_queue ssq ON s.id = ssq.space_id
WHERE ssq.status = 'pending'
ORDER BY ssq.created_at DESC;
```

**Note** : Note l'ID de l'espace qui pose problème.

### **Étape 2 : Vérifier les doublons**

```sql
-- Identifier les doublons potentiels
SELECT 
    space_id, 
    event_type, 
    COUNT(*) as duplicate_count
FROM public.stripe_sync_queue
GROUP BY space_id, event_type
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

## 🔧 **Solutions par Ordre de Priorité**

### **Solution 1 : Nettoyage Ciblé (Recommandé)**

Si tu connais l'ID de l'espace problématique :

```sql
-- Remplace 'SPACE_ID_HERE' par l'ID réel de l'espace
DELETE FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE'
AND status = 'pending';
```

### **Solution 2 : Nettoyage des Doublons**

```sql
-- Supprimer les doublons en gardant le plus récent
DELETE FROM public.stripe_sync_queue
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY space_id, event_type 
                   ORDER BY created_at DESC
               ) as rn
        FROM public.stripe_sync_queue
    ) t
    WHERE t.rn > 1
);
```

### **Solution 3 : Nettoyage Complet (Si nécessaire)**

```sql
-- Nettoyer tous les jobs problématiques
BEGIN;

-- Jobs avec valeurs NULL
DELETE FROM public.stripe_sync_queue
WHERE space_id IS NULL OR event_type IS NULL OR status IS NULL;

-- Jobs bloqués (plus de 1 heure)
DELETE FROM public.stripe_sync_queue
WHERE status = 'pending' AND created_at < NOW() - INTERVAL '1 hour';

-- Doublons
DELETE FROM public.stripe_sync_queue
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY space_id, event_type 
                   ORDER BY created_at DESC
               ) as rn
        FROM public.stripe_sync_queue
    ) t
    WHERE t.rn > 1
);

-- Jobs avec statuts invalides
DELETE FROM public.stripe_sync_queue
WHERE status NOT IN ('pending', 'processing', 'completed', 'failed');

COMMIT;
```

## ✅ **Vérification Post-Nettoyage**

### **Étape 3 : Vérifier que le nettoyage a fonctionné**

```sql
-- Vérifier qu'il n'y a plus de doublons
SELECT 
    space_id, 
    event_type, 
    COUNT(*) as count
FROM public.stripe_sync_queue
GROUP BY space_id, event_type
HAVING COUNT(*) > 1;

-- Voir les jobs restants
SELECT 
    id,
    space_id,
    event_type,
    status,
    created_at
FROM public.stripe_sync_queue
ORDER BY created_at DESC
LIMIT 10;
```

### **Étape 4 : Tester la synchronisation**

1. **Retourne dans ton interface React**
2. **Clique sur "Synchroniser" pour l'espace problématique**
3. **Vérifie qu'il n'y a plus d'erreur 409**

## 🎯 **Pourquoi l'Upsert ne Fonctionnait Pas**

### **Causes Possibles :**

1. **Données corrompues** : Lignes avec des valeurs NULL ou invalides
2. **Doublons existants** : Plusieurs lignes pour la même clé unique
3. **Jobs bloqués** : Anciens jobs en statut 'pending' qui bloquent
4. **Contrainte corrompue** : Problème avec la contrainte UNIQUE

### **Pourquoi l'Upsert Échoue :**

```javascript
// L'upsert ne peut pas fonctionner si :
// 1. Il y a des doublons dans la table
// 2. La contrainte UNIQUE est violée
// 3. Les données sont corrompues
.upsert(data, { onConflict: ['space_id', 'event_type'] })
```

## 🛡️ **Prévention Future**

### **1. Monitoring Régulier**

```sql
-- Script à exécuter régulièrement pour détecter les problèmes
SELECT 
    'Doublons' as problem_type,
    COUNT(*) as count
FROM (
    SELECT space_id, event_type
    FROM public.stripe_sync_queue
    GROUP BY space_id, event_type
    HAVING COUNT(*) > 1
) t

UNION ALL

SELECT 
    'Jobs bloqués' as problem_type,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE status = 'pending' 
AND created_at < NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
    'Valeurs NULL' as problem_type,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id IS NULL OR event_type IS NULL OR status IS NULL;
```

### **2. Nettoyage Automatique**

Créer une fonction Edge qui nettoie automatiquement :

```typescript
// Fonction de nettoyage automatique
export async function cleanupStripeSyncQueue() {
  const { error } = await supabase.rpc('cleanup_stripe_sync_queue');
  return { success: !error, error };
}
```

## 📞 **Si le Problème Persiste**

### **Informations à Fournir :**

1. **ID de l'espace problématique**
2. **Résultat de la requête de diagnostic**
3. **Message d'erreur exact**
4. **Timestamp de l'erreur**

### **Commandes de Debug :**

```sql
-- Debug complet pour un espace spécifique
SELECT 
    'Jobs pour cet espace' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE'

UNION ALL

SELECT 
    'Jobs en pending' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE' AND status = 'pending'

UNION ALL

SELECT 
    'Jobs récents' as info,
    COUNT(*) as count
FROM public.stripe_sync_queue
WHERE space_id = 'SPACE_ID_HERE' 
AND created_at > NOW() - INTERVAL '1 hour';
```

---

**Status** : 🔧 **EN COURS** - Suivre les étapes ci-dessus pour résoudre l'erreur 409 restante 