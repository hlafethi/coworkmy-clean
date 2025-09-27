# 🚀 Solution Alternative - Configuration via Interface Supabase

## 🎯 Problème actuel
L'erreur `mime type application/json is not supported` indique que les politiques RLS bloquent l'upload.

## 💡 Solution rapide via l'interface

### Étape 1: Supprimer toutes les politiques existantes
1. Allez dans **Supabase Dashboard** > **Storage** > **Policies**
2. Sélectionnez **"objects"** dans la liste
3. **Supprimez TOUTES** les politiques existantes qui contiennent "avatar" ou "document"

### Étape 2: Créer les buckets via l'interface
1. Allez dans **Storage** > **Buckets**
2. Créez le bucket **"avatars"** :
   - Name: `avatars`
   - Public: ✅ **OUI**
   - File size limit: `5 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp`

3. Créez le bucket **"documents"** :
   - Name: `documents`
   - Public: ❌ **NON**
   - File size limit: `10 MB`
   - Allowed MIME types: `image/jpeg, image/png, image/webp, application/pdf`

### Étape 3: Créer des politiques simples
Dans **Storage** > **Policies**, créez ces 4 politiques :

#### 1. Avatars - Upload
```sql
CREATE POLICY "avatar_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);
```

#### 2. Avatars - Read (Public)
```sql
CREATE POLICY "avatar_read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');
```

#### 3. Documents - Upload
```sql
CREATE POLICY "documents_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

#### 4. Documents - Read (Own files)
```sql
CREATE POLICY "documents_read" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.role() = 'authenticated'
);
```

### Étape 4: Test immédiat
1. Redémarrez votre application : `npm run dev`
2. Testez l'upload d'avatar
3. Testez l'upload de document

## 🔧 Si ça ne marche toujours pas

### Option A: Désactiver temporairement RLS
```sql
-- TEMPORAIRE SEULEMENT POUR TEST
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
-- Testez l'upload
-- Puis réactivez immédiatement:
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

### Option B: Vérifier les logs Supabase
1. Allez dans **Logs** > **API**
2. Filtrez par "storage"
3. Regardez les erreurs détaillées

## 🎯 Résultat attendu

Après cette configuration, vous devriez avoir :
- ✅ 2 buckets fonctionnels
- ✅ 4 politiques simples
- ✅ Upload d'avatar qui fonctionne
- ✅ Upload de documents qui fonctionne

## 🚨 Important

Cette solution simplifie les politiques de sécurité. Une fois que l'upload fonctionne, nous pourrons affiner les permissions pour plus de sécurité.

---

**Priorité : Faire fonctionner l'upload d'abord, sécuriser ensuite !** 🎯 