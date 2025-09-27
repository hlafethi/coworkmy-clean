# Guide d'installation et de configuration de Tawk.to

Ce document explique comment configurer Tawk.to pour votre application de gestion d'espace de coworking.

## Table des matières

1. [Installation de Tawk.to](#installation-de-tawkto)
2. [Configuration de base](#configuration-de-base)
3. [Intégration avec l'application](#intégration-avec-lapplication)
4. [Personnalisation avancée](#personnalisation-avancée)
5. [Dépannage](#dépannage)

## Installation de Tawk.to

Tawk.to est une solution de chat en direct gratuite qui offre toutes les fonctionnalités dont vous avez besoin pour votre espace de coworking :

1. Créez un compte sur [Tawk.to](https://www.tawk.to/)
2. Connectez-vous à votre tableau de bord
3. Configurez votre widget de chat

## Configuration de base

Une fois votre compte Tawk.to créé, suivez ces étapes pour la configuration initiale :

1. **Configurer votre profil** :
   - Ajoutez votre nom, photo et informations de contact
   - Configurez les heures de disponibilité

2. **Configurer les notifications** :
   - Activez les notifications par e-mail
   - Configurez les notifications de bureau
   - Activez les notifications sonores

3. **Personnaliser l'apparence** :
   - Choisissez les couleurs qui correspondent à votre marque
   - Personnalisez les messages d'accueil
   - Configurez les messages automatiques

## Intégration avec l'application

L'intégration avec votre application est déjà configurée dans le code. Voici les fichiers clés :

1. **index.html** : Le script Tawk.to est directement intégré dans ce fichier
   - Situé à la fin du fichier, juste avant la fermeture de la balise `</body>`
   - Le script contient déjà votre ID de site Tawk.to : `6814a0bf8faaf719186dcee6/1iq897rfd`

2. **TawkToWidget.tsx** : Un composant React vide qui sert de placeholder
   - Situé dans `src/components/common/TawkToWidget.tsx`
   - Ce composant ne fait rien car l'intégration est gérée directement dans index.html
   - Nous avons simplifié ce composant pour éviter les erreurs de Router

3. **App.tsx** : Le composant TawkToWidget est référencé mais ne fait rien

4. **useTawkTo.ts** : Un hook personnalisé pour intégrer Tawk.to avec l'utilisateur connecté
   - Situé dans `src/hooks/useTawkTo.ts`
   - Utilisé dans les composants Dashboard et AdminDashboard pour identifier les utilisateurs

## Personnalisation avancée

### Personnalisation de l'apparence

Vous pouvez personnaliser l'apparence du widget dans les paramètres de votre compte Tawk.to :

1. Connectez-vous à votre tableau de bord Tawk.to
2. Allez dans "Administration" > "Apparence du widget"
3. Personnalisez les couleurs, les textes et le comportement du widget

### Intégration avec l'authentification

Pour identifier les utilisateurs connectés, vous pouvez ajouter ce code dans votre composant de connexion (par exemple, dans `src/pages/auth/Login.tsx` après une connexion réussie) :

```javascript
// À ajouter dans votre code lorsqu'un utilisateur se connecte
if (window.Tawk_API) {
  window.Tawk_API.visitor = {
    name: user.email,
    email: user.email
  };
}
```

Vous pouvez également utiliser le hook personnalisé `useTawkTo` que nous avons créé :

```javascript
import { useTawkTo } from '@/hooks/useTawkTo';

// Dans votre composant
const { user } = useAuth();
useTawkTo(user, ['dashboard', 'member']);
```

### Ajout de balises et de métadonnées

Vous pouvez ajouter des balises et des métadonnées pour chaque utilisateur :

```javascript
// Ajouter des balises
Tawk_API.addTags(['premium', 'coworking'], function(error){});

// Ajouter des métadonnées
Tawk_API.addEvent('user-type', 'premium', function(error){});
```

### Déclenchement d'actions spécifiques

Vous pouvez déclencher des actions spécifiques depuis votre code :

```javascript
// Ouvrir la fenêtre de chat
Tawk_API.maximize();

// Masquer la fenêtre de chat
Tawk_API.minimize();

// Définir le statut
Tawk_API.onStatusChange = function(status){
  console.log(status);
};
```

## Dépannage

### Le widget ne s'affiche pas

- Vérifiez que le script Tawk.to est correctement chargé (vérifiez la console du navigateur)
- Assurez-vous que votre site est accessible publiquement (Tawk.to ne fonctionne pas sur localhost dans certains cas)
- Vérifiez que vous êtes en ligne dans votre tableau de bord Tawk.to

### Les notifications ne fonctionnent pas

- Vérifiez que les notifications sont activées dans les paramètres du navigateur
- Assurez-vous que les notifications sont activées dans les paramètres de Tawk.to
- Vérifiez que vous êtes connecté à votre compte Tawk.to

### Problèmes de performance

- Le widget Tawk.to est conçu pour être léger, mais si vous rencontrez des problèmes de performance, vous pouvez :
  - Charger le script de manière asynchrone (déjà configuré)
  - Charger le script uniquement sur certaines pages
  - Utiliser la fonction de chargement différé (lazy loading)

### Erreurs TypeScript dans les fonctions Edge

Si vous voyez des erreurs TypeScript dans les fichiers de fonctions Edge Supabase (comme `chatwoot-webhook/index.ts`), ne vous inquiétez pas. Ces erreurs sont normales dans l'éditeur VS Code car il ne reconnaît pas par défaut les types et imports spécifiques à Deno :

```
Cannot find module 'http/server' or its corresponding type declarations.
Cannot find name 'Deno'.
```

Nous avons ajouté des commentaires `@ts-ignore` dans le fichier pour ignorer ces erreurs. Ces erreurs n'affecteront pas la fonctionnalité lorsque la fonction sera déployée sur Supabase Edge Functions, qui utilise l'environnement d'exécution Deno.
