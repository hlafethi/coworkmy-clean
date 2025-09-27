# 📁 Configuration des buckets de stockage

## 🎯 Buckets à créer

Vous devez créer **2 buckets** :
1. **`avatars`** - Pour les photos de profil (public)
2. **`documents`** - Pour les documents sécurisés (privé)

## 🎯 Étapes via l'interface Supabase

### 1. Accéder au Storage
1. Allez dans votre projet Supabase
2. Cliquez sur **"Storage"** dans le menu de gauche
3. Cliquez sur **"Create a new bucket"**

### 2. Créer le bucket AVATARS (premier)
- **Name**: `avatars`
- **Public bucket**: ✅ **OUI** (cochez cette option)
- **File size limit**: `5 MB`
- **Allowed MIME types**: Ajoutez ces types :
  ```
  image/jpeg
  image/jpg
  image/png
  image/webp
  ```

### 3. Créer le bucket DOCUMENTS (second)
- **Name**: `documents`
- **Public bucket**: ❌ **NON** (décochez cette option)
- **File size limit**: `10 MB`
- **Allowed MIME types**: Ajoutez ces types un par un :
  ```
  image/jpeg
  image/jpg
  image/png
  image/webp
  application/pdf
  application/msword
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
  application/vnd.ms-excel
  application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  text/plain
  text/csv
  ```

### 4. Configurer les politiques RLS

#### Pour le bucket AVATARS :
1. Allez dans **"Storage"** > **"Policies"**
2. Sélectionnez le bucket **"avatars"**
3. Cliquez sur **"New Policy"** et ajoutez ces politiques :

```sql
-- Upload d'avatar
CREATE POLICY "Users can upload their own avatar" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Lecture des avatars (public)
CREATE POLICY "Anyone can view avatars" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- Suppression d'avatar
CREATE POLICY "Users can delete their own avatar" ON storage.objects
FOR DELETE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Mise à jour d'avatar
CREATE POLICY "Users can update their own avatar" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);
```

#### Pour le bucket DOCUMENTS :
1. Sélectionnez le bucket **"documents"**
2. Cliquez sur **"New Policy"** et ajoutez ces politiques :

#### Politique 1: Upload (INSERT)
```sql
CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);
```

#### Politique 2: Lecture (SELECT)
```sql
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);
```

#### Politique 3: Suppression (DELETE)
```sql
CREATE POLICY "Users can delete their own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);
```

#### Politique 4: Mise à jour (UPDATE)
```sql
CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'documents' 
  AND auth.uid()::text = (storage.foldername(name))[2]
  AND auth.role() = 'authenticated'
);
```

## ✅ Vérification

Une fois configuré, vous devriez voir :
- Un bucket nommé **"avatars"** marqué comme **"Public"** avec 4 politiques RLS
- Un bucket nommé **"documents"** marqué comme **"Private"** avec 4 politiques RLS

## 🚨 Si vous avez des erreurs

### Erreur "must be owner of table objects"
- Utilisez l'interface graphique au lieu du SQL Editor
- Les politiques RLS doivent être créées via Storage > Policies

### Bucket déjà existant
- Supprimez l'ancien bucket s'il existe
- Recréez-le avec les bonnes configurations

## 🔍 Test des buckets

Pour tester si tout fonctionne :
1. **Test avatars** : Allez dans votre profil et changez votre photo de profil
2. **Test documents** : Essayez d'uploader un document dans la section Documents
3. Vérifiez que les fichiers apparaissent dans Storage > avatars et Storage > documents

---

**Note**: Les politiques RLS garantissent que chaque utilisateur ne peut accéder qu'à ses propres fichiers. 