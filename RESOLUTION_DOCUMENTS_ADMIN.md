# Résolution : Affichage des documents côté admin

## Problème rencontré

Les documents des utilisateurs ne s'affichent pas dans l'interface d'administration, même si les logos et avatars fonctionnent correctement.

## Erreur identifiée

```
Could not find a relationship between 'profile_documents' and 'profiles' in the schema cache
```

## Cause du problème

1. **Relation non reconnue** : Supabase ne reconnaît pas la relation entre `profile_documents` et `profiles`
2. **Structure de table** : La table `profile_documents` utilise `profile_id` au lieu de `user_id` directement
3. **Colonnes manquantes** : Certaines colonnes attendues par le composant n'existent pas dans la table

## Solutions appliquées

### 1. Correction de la requête

**Avant** (jointure qui ne fonctionne pas) :
```typescript
const { data, error } = await supabase
  .from('profile_documents')
  .select(`
    id,
    document_type,
    document_url,
    profiles!inner(user_id)
  `)
  .eq('profiles.user_id', userId);
```

**Après** (deux requêtes séparées) :
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
    created_at
  `)
  .eq('profile_id', profileData.id);
```

### 2. Ajout des colonnes manquantes

```sql
-- Ajouter file_name si elle n'existe pas
ALTER TABLE profile_documents ADD COLUMN IF NOT EXISTS file_name text;

-- Mettre à jour les enregistrements existants
UPDATE profile_documents 
SET file_name = SPLIT_PART(document_url, '/', -1)
WHERE file_name IS NULL OR file_name = '';
```

### 3. Vérification de la relation

```sql
-- Vérifier si la contrainte de clé étrangère existe
SELECT constraint_name, table_name, column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'profile_documents';

-- Créer la contrainte si elle n'existe pas
ALTER TABLE profile_documents 
ADD CONSTRAINT profile_documents_profile_id_fkey 
FOREIGN KEY (profile_id) REFERENCES profiles(id);
```

## Transformation des données

Le composant attend une interface `UserDocument` spécifique :

```typescript
interface UserDocument {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  document_type: string;
  uploaded_at: string;
  scan_status?: 'pending' | 'clean' | 'infected' | 'error';
}
```

Transformation appliquée :
```typescript
const transformedData = data?.map(doc => ({
  id: doc.id,
  user_id: userId,
  file_url: doc.document_url,
  file_name: doc.file_name || doc.document_url.split('/').pop() || 'Document',
  file_size: doc.file_size || 0,
  file_type: doc.file_type || 'application/octet-stream',
  document_type: doc.document_type,
  uploaded_at: doc.created_at,
  scan_status: doc.verified ? 'clean' : 'pending'
})) || [];
```

## Logs de débogage

Ajout de logs détaillés pour faciliter le débogage :

```typescript
console.log('🔍 Chargement des documents pour userId:', userId);
console.log('✅ Profil trouvé:', profileData);
console.log('📄 Résultat de la requête documents:', { data, error });
console.log('✅ Documents transformés:', transformedData.length, 'documents');
```

## Actions à effectuer

1. **Exécuter les scripts SQL** :
   - `add_file_name_to_profile_documents.sql`
   - `fix_profile_documents_relation.sql`

2. **Vérifier les logs** dans la console du navigateur

3. **Tester l'affichage** des documents dans l'interface admin

## Résultat attendu

- Les documents des utilisateurs s'affichent correctement dans l'interface admin
- Chaque document montre : nom, type, taille, statut de vérification
- Possibilité de voir et télécharger les documents
- Logs détaillés pour le débogage

## Prévention

- Toujours vérifier les relations entre tables lors de la création de nouvelles fonctionnalités
- Utiliser des requêtes simples plutôt que des jointures complexes avec Supabase
- Ajouter des logs de débogage pour faciliter le diagnostic 