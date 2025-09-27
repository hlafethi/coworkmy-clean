# Résolution des problèmes de cache Vite

## Problème rencontré

Erreur lors du chargement dynamique des modules :
```
Failed to fetch dynamically imported module: http://localhost:3000/src/pages/admin/AdminDashboard.tsx
```

## Causes possibles

1. **Cache Vite corrompu** : Le cache de Vite peut être corrompu après des modifications importantes
2. **Modules non recompilés** : Les modules modifiés ne sont pas recompilés correctement
3. **Conflits d'imports** : Problèmes d'imports circulaires ou incorrects

## Solutions

### 1. Nettoyage du cache Vite (Recommandé)

```bash
# Arrêter le serveur de développement
# Puis nettoyer le cache
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

# Redémarrer le serveur
npm run dev
```

### 2. Nettoyage complet (Si le problème persiste)

```bash
# Nettoyer le cache npm
npm cache clean --force

# Supprimer node_modules et réinstaller
rm -rf node_modules
npm install

# Redémarrer le serveur
npm run dev
```

### 3. Vérification des imports

S'assurer que tous les imports sont corrects :

```typescript
// ✅ Correct
import { UserDocuments } from "../UserDocuments";

// ❌ Incorrect (si le composant est exporté par défaut)
import UserDocuments from "../UserDocuments";
```

### 4. Vérification des exports

S'assurer que les exports sont cohérents :

```typescript
// ✅ Export nommé
export { UserDocuments };

// ✅ Export par défaut
export default UserDocuments;
```

## Prévention

1. **Redémarrer régulièrement** : Redémarrer le serveur de développement après des modifications importantes
2. **Vérifier les imports** : S'assurer que les imports correspondent aux exports
3. **Nettoyer le cache** : Nettoyer le cache Vite en cas de comportement étrange

## Script de nettoyage automatique

Créer un script `fix-vite-cache.sh` :

```bash
#!/bin/bash

echo "🧹 Nettoyage du cache Vite..."

# Arrêter le serveur de développement s'il tourne
pkill -f "vite" || true

# Nettoyer le cache Vite
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

# Nettoyer le cache npm si nécessaire
npm cache clean --force

echo "📦 Réinstallation des dépendances..."
npm install

echo "🚀 Redémarrage du serveur de développement..."
npm run dev
```

## Notes importantes

- Le cache Vite est stocké dans `node_modules/.vite`
- Les erreurs de chargement dynamique sont souvent liées au cache
- Toujours vérifier les imports/exports après des modifications de structure
- En cas de doute, redémarrer le serveur de développement 