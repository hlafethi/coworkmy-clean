# Résolution Finale : Affichage des documents côté admin

## Problème identifié

```
column profile_documents.document_url does not exist
```

## Cause racine

La table `profile_documents` n'a pas toutes les colonnes nécessaires pour le composant `UserDocuments`. Les colonnes manquantes sont :
- `document_url`
- `file_name` 
- `file_size`
- `file_type`

## Solution complète

### 1. Ajouter les colonnes manquantes

Exécuter le script `add_missing_columns_to_profile_documents.sql` :

```sql
-- Ajouter les colonnes manquantes
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS document_url text;
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_size integer;
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_type text;

-- Mettre à jour les enregistrements existants
UPDATE profile_documents 
SET 
  document_url = '',
  file_name = CONCAT('Document ', document_type),
  file_size = 0,
  file_type = 'application/octet-stream'
WHERE document_url IS NULL OR file_name IS NULL OR file_size IS NULL OR file_type IS NULL;
```

### 2. Structure de table finale

La table `profile_documents` devrait avoir cette structure :

```sql
CREATE TABLE profile_documents (
  id UUID PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id),
  document_type VARCHAR(50),
  document_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  verified BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3. Requête corrigée

Le composant utilise maintenant deux requêtes séparées :

```typescript
// 1. Récupérer le profile_id
const { data: profileData } = await supabase
  .from('profiles')
  .select('id')
  .eq('user_id', userId)
  .single();

// 2. Récupérer les documents
const { data, error } = await supabase
  .from('profile_documents')
  .select(`
    id,
    document_type,
    document_url,
    file_name,
    file_size,
    file_type,
    verified,
    created_at,
    updated_at
  `)
  .eq('profile_id', profileData.id)
  .order('created_at', { ascending: false });
```

### 4. Transformation des données

```typescript
const transformedData = data?.map(doc => ({
  id: doc.id,
  user_id: userId,
  file_url: doc.document_url || '',
  file_name: doc.file_name || `Document ${doc.document_type}`,
  file_size: doc.file_size || 0,
  file_type: doc.file_type || 'application/octet-stream',
  document_type: doc.document_type,
  uploaded_at: doc.created_at,
  scan_status: doc.verified ? 'clean' : 'pending'
})) || [];
```

## Actions à effectuer

1. **Exécuter la migration** :
   ```bash
   # Exécuter le contenu de add_missing_columns_to_profile_documents.sql
   ```

2. **Redémarrer l'application** si nécessaire

3. **Vérifier les logs** dans la console

## Résultat attendu

- ✅ Les documents s'affichent dans l'interface admin
- ✅ Chaque document montre ses informations complètes
- ✅ Possibilité de voir et télécharger les documents
- ✅ Gestion des valeurs par défaut pour les champs manquants

## Logs de débogage

Les logs devraient maintenant montrer :
```
🔍 Chargement des documents pour userId: [id]
✅ Profil trouvé: {id: [profile_id]}
📄 Résultat de la requête documents: {data: [...], error: null}
✅ Documents transformés: X documents
```

## Prévention future

- Toujours vérifier la structure de table avant de créer des composants
- Utiliser des migrations pour ajouter de nouvelles colonnes
- Tester les requêtes avec des données réelles
- Ajouter des logs de débogage pour faciliter le diagnostic 