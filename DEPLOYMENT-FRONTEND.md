# 🚀 Guide de Déploiement Frontend

## 📋 **Problème résolu :**

Le frontend utilisait `http://localhost:5000` au lieu de `http://147.93.58.155:3003` pour communiquer avec le backend.

## ✅ **Solution appliquée :**

1. **Configuration dynamique de l'API** dans `src/lib/api-client.ts`
2. **Script de configuration** injecté dans `dist/index.html`
3. **Types TypeScript** pour `window.APP_CONFIG`

## 🔧 **Étapes de déploiement :**

### 1. **Reconstruire le frontend**
```bash
npm run build
```

### 2. **Copier les fichiers sur le VPS**
```bash
# Via SCP
scp -r dist/* root@147.93.58.155:/opt/coworkmy/

# Ou via PowerShell
.\deploy-frontend.ps1
```

### 3. **Redémarrer les conteneurs dans Portainer**
- Aller dans **Portainer > Stacks > coworkmy-production**
- Cliquer sur **"Update the stack"**
- Redémarrer les conteneurs

## 🎯 **Résultat attendu :**

- ✅ **Plus d'erreurs CORS**
- ✅ **Frontend communique avec `http://147.93.58.155:3003`**
- ✅ **Application fonctionnelle**

## 🔍 **Vérification :**

1. **Ouvrir** `http://147.93.58.155:3002`
2. **F12** > Console
3. **Vérifier** que les requêtes vont vers `147.93.58.155:3003`
4. **Plus d'erreurs** `localhost:5000`

## 📝 **Fichiers modifiés :**

- `src/lib/api-client.ts` - Configuration dynamique de l'API
- `dist/index.html` - Script de configuration injecté
- `src/types/global.d.ts` - Types TypeScript
- `public/config.js` - Configuration alternative

## 🚨 **En cas de problème :**

1. **Vérifier** que le script est dans `dist/index.html`
2. **Redémarrer** les conteneurs
3. **Vider le cache** du navigateur (Ctrl+F5)
