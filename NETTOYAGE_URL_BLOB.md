# 🧹 Guide de Nettoyage des URL Blob

## Problème
Des URL blob (ex: `blob:http://localhost:3000/9cb31669-feb5-4c4b-97e2-2d5fb85ea23c`) sont stockées dans la base de données, causant l'erreur `net::ERR_FILE_NOT_FOUND` côté front.

## Solution Rapide

### Option 1: Via la Console du Navigateur (Recommandé)

1. **Ouvre la console de ton navigateur** (F12)
2. **Copie-colle ce code** dans la console :

```javascript
// Récupérer le client Supabase de l'app
const supabase = window.supabase || window.supabaseClient;

async function cleanupBlobUrls() {
  console.log('🧹 Début du nettoyage...');
  
  try {
    // Nettoyer admin_settings
    const { data: adminSettings } = await supabase.from('admin_settings').select('*');
    
    for (const setting of adminSettings || []) {
      if (setting.value && typeof setting.value === 'object') {
        let updated = false;
        const newValue = { ...setting.value };
        
        // Vérifier hero_background_image
        if (newValue.hero_background_image && newValue.hero_background_image.startsWith('blob:')) {
          console.log('❌ URL blob trouvée:', newValue.hero_background_image);
          newValue.hero_background_image = null;
          updated = true;
        }
        
        if (updated) {
          await supabase.from('admin_settings').update({ value: newValue }).eq('key', setting.key);
          console.log('✅ Nettoyé');
        }
      }
    }
    
    console.log('✅ Nettoyage terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

cleanupBlobUrls();
```

3. **Appuie sur Entrée** pour exécuter
4. **Rafraîchis la page** pour voir les changements

### Option 2: Via Supabase SQL Editor

1. **Va dans ton dashboard Supabase**
2. **Ouvre SQL Editor**
3. **Exécute ce script** :

```sql
-- Nettoyer admin_settings
UPDATE admin_settings 
SET value = jsonb_set(value, '{hero_background_image}', 'null', false) 
WHERE value->>'hero_background_image' LIKE 'blob:%';

-- Nettoyer profiles
UPDATE profiles 
SET avatar_url = NULL 
WHERE avatar_url LIKE 'blob:%';

-- Nettoyer spaces
UPDATE spaces 
SET image_url = NULL 
WHERE image_url LIKE 'blob:%';

-- Nettoyer documents
UPDATE documents 
SET file_url = NULL 
WHERE file_url LIKE 'blob:%';
```

## Vérification

Après le nettoyage, tu ne devrais plus voir :
- ❌ `[ImageUploader] URL blob détectée`
- ❌ `[Hero] URL blob détectée`
- ❌ `net::ERR_FILE_NOT_FOUND`

## Prévention

Les corrections apportées empêchent maintenant :
- ✅ Upload d'URL blob dans ImageUploader
- ✅ Sauvegarde d'URL blob dans le formulaire admin
- ✅ Utilisation d'URL blob côté front (fallback sur image par défaut)

## Si le problème persiste

1. **Vérifie le localStorage** : `localStorage.clear()`
2. **Vérifie le sessionStorage** : `sessionStorage.clear()`
3. **Rafraîchis complètement** : Ctrl+F5
4. **Vide le cache** du navigateur 