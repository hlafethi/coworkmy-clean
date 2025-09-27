# 🔧 Guide de Configuration - Clé Service Role

## ❌ Problème actuel
Erreur 401 "Invalid JWT" lors de l'appel des fonctions Edge Stripe.

## ✅ Solution

### 1. Récupérer la clé Service Role

**Dans le Dashboard Supabase :**
1. Aller sur https://supabase.com/dashboard/project/exffryodynkyizbeesbt/settings/api
2. Copier la **Service Role Key** (pas l'Anon Key)

### 2. Configurer la variable d'environnement

**Dans le fichier `.env.local` :**
```bash
# Clés existantes
VITE_SUPABASE_URL=https://exffryodynkyizbeesbt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# NOUVELLE CLÉ - Ajouter cette ligne
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Redémarrer le serveur de développement

```bash
npm run dev
# ou
yarn dev
```

### 4. Tester la configuration

**Dans la console du navigateur :**
```javascript
// Copier-coller ce code dans la console
console.log('Test config:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasAnon: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  hasService: !!import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
});
```

### 5. Tester la synchronisation

1. Aller dans l'interface admin
2. Cliquer sur "Tout synchroniser"
3. Vérifier les logs dans la console

## 🔍 Vérification

**Si la configuration est correcte :**
- ✅ Pas d'erreur 401
- ✅ Synchronisation Stripe fonctionnelle
- ✅ Logs de succès dans la console

**Si problème persiste :**
- ❌ Vérifier que la clé service_role est correcte
- ❌ Redémarrer le serveur après modification du .env
- ❌ Vérifier les logs de la fonction Edge

## 🚨 Sécurité

⚠️ **Important :** La clé service_role a des privilèges élevés. Ne jamais :
- L'exposer dans le code client public
- La commiter dans Git
- La partager publiquement

## 📝 Logs de debug

**Pour voir les logs de la fonction Edge :**
```bash
supabase functions logs stripe-sync-queue --follow
```

**Dans la console du navigateur :**
```javascript
// Test direct de la fonction
const { data, error } = await supabaseAdmin.functions.invoke('stripe-sync-queue', {
  body: { action: 'sync_all' }
});
console.log('Résultat:', { data, error });
``` 