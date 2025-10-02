# 🔄 Guide de Forçage de Reconnexion

## **🎯 PROBLÈME IDENTIFIÉ :**

L'utilisateur est connecté avec l'ancien token qui contient l'ID `2` au lieu du nouvel UUID. Il faut forcer la reconnexion pour obtenir le nouveau token avec l'UUID correct.

## **🔧 SOLUTION :**

### **1. Déconnexion forcée :**

#### **Méthode 1 - Via l'interface :**
1. **Cliquez sur "Déconnexion"** dans l'interface
2. **Rafraîchissez la page** (F5)
3. **Reconnectez-vous** avec `user@heleam.com` / `user123`

#### **Méthode 2 - Via la console du navigateur :**
1. **Ouvrez la console** (F12)
2. **Exécutez ces commandes :**
```javascript
// Supprimer le token du localStorage
localStorage.removeItem('token');
localStorage.removeItem('user');

// Supprimer le token du sessionStorage
sessionStorage.removeItem('token');
sessionStorage.removeItem('user');

// Recharger la page
window.location.reload();
```

#### **Méthode 3 - Via les DevTools :**
1. **Ouvrez les DevTools** (F12)
2. **Allez dans l'onglet "Application"**
3. **Dans "Local Storage"** → Supprimez `token` et `user`
4. **Dans "Session Storage"** → Supprimez `token` et `user`
5. **Rechargez la page** (F5)

### **2. Reconnexion :**

1. **Allez sur la page de connexion**
2. **Connectez-vous** avec :
   - **Email :** `user@heleam.com`
   - **Mot de passe :** `user123`

### **3. Vérification :**

Après la reconnexion, les logs devraient montrer :
```
✅ Session restaurée: {userId: "f6682b18-7d10-4016-be08-885e989cffca"}
✅ Profil utilisateur récupéré: {success: true, data: {...}}
```

Au lieu de :
```
❌ Session restaurée: {userId: 2}
❌ Profil utilisateur récupéré: {success: false, data: null, error: 'Erreur serveur'}
```

## **🔍 Logs de débogage ajoutés :**

Le serveur affichera maintenant :
- `🔑 Token décodé:` - Montre l'ID dans le token
- `🔍 Debug /api/users/:id:` - Détails de la requête
- `req.user complet:` - Informations complètes de l'utilisateur

## **🎯 Résultat attendu :**

Après la reconnexion :
- ✅ **ID utilisateur** → UUID (`f6682b18-7d10-4016-be08-885e989cffca`)
- ✅ **Upload d'avatar** → Fonctionne et persiste
- ✅ **Upload de logo** → Fonctionne et persiste
- ✅ **Profil utilisateur** → Récupéré avec succès
- ✅ **Persistance des données** → Entièrement opérationnelle

## **🚀 Test final :**

1. **Déconnectez-vous** (méthode 1, 2 ou 3)
2. **Reconnectez-vous** avec `user@heleam.com` / `user123`
3. **Uploadez un avatar** → Doit fonctionner
4. **Uploadez un logo** → Doit fonctionner
5. **Rafraîchissez la page** → Les images persistent
6. **Reconnectez-vous** → Les données persistent

**L'application sera alors entièrement fonctionnelle !** 🎉
