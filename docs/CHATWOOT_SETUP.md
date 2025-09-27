# Guide d'installation et de configuration de Chatwoot

Ce document explique comment configurer Chatwoot pour votre application de gestion d'espace de coworking.

## Table des matières

1. [Installation de Chatwoot](#installation-de-chatwoot)
2. [Configuration de base](#configuration-de-base)
3. [Intégration avec l'application](#intégration-avec-lapplication)
4. [Configuration des webhooks](#configuration-des-webhooks)
5. [Personnalisation avancée](#personnalisation-avancée)

## Installation de Chatwoot

### Option 1 : Utiliser Chatwoot Cloud (recommandé pour démarrer rapidement)

1. Créez un compte sur [Chatwoot.com](https://www.chatwoot.com/get-started)
2. Suivez les instructions pour configurer votre compte et votre première boîte de réception

### Option 2 : Auto-hébergement (pour un contrôle total)

#### Prérequis
- Un serveur avec Docker et Docker Compose
- Un nom de domaine pointant vers votre serveur
- Un certificat SSL (Let's Encrypt recommandé)

#### Installation avec Docker

```bash
# Cloner le dépôt
git clone https://github.com/chatwoot/chatwoot.git
cd chatwoot

# Copier le fichier d'environnement exemple
cp .env.example .env

# Modifier les variables d'environnement
nano .env

# Lancer Chatwoot avec Docker Compose
docker-compose up -d
```

## Configuration de base

Une fois Chatwoot installé, suivez ces étapes pour la configuration initiale :

1. **Créer un compte administrateur** : Suivez les instructions à l'écran lors de la première connexion
2. **Configurer une boîte de réception** :
   - Allez dans "Settings" > "Inboxes" > "Add Inbox"
   - Sélectionnez "Website" comme type de boîte de réception
   - Remplissez les informations demandées (nom, site web, etc.)
   - Notez le "Website Token" qui sera utilisé dans l'intégration

3. **Configurer les horaires d'ouverture** :
   - Allez dans "Settings" > "Inboxes" > [Votre boîte de réception] > "Business Hours"
   - Définissez les horaires d'ouverture pour chaque jour de la semaine
   - Activez ou désactivez les jours selon vos besoins

4. **Configurer les notifications** :
   - Allez dans "Profile Settings" > "Notifications"
   - Activez les notifications sonores et les notifications de bureau

## Intégration avec l'application

L'intégration avec votre application est déjà configurée dans le code. Voici les fichiers clés :

1. **index.html** : Le script Chatwoot est directement intégré dans ce fichier
   - **Important** : Remplacez `VOTRE_WEBSITE_TOKEN` par le token obtenu lors de la création de la boîte de réception
   - Situé à la fin du fichier, juste avant la fermeture de la balise `</body>`

2. **ChatwootWidget.tsx** : Un composant React vide qui sert de placeholder
   - Situé dans `src/components/common/ChatwootWidget.tsx`
   - Ce composant ne fait rien car l'intégration est gérée directement dans index.html

3. **App.tsx** : Le composant ChatwootWidget est déjà ajouté à l'application

## Configuration des webhooks

Pour synchroniser les conversations Chatwoot avec votre base de données Supabase :

1. **Déployer la fonction Edge Supabase** :
   ```bash
   cd supabase/functions/chatwoot-webhook
   supabase functions deploy chatwoot-webhook --project-ref votre-ref-projet
   ```

2. **Configurer le webhook dans Chatwoot** :
   - Allez dans "Settings" > "Integrations" > "Webhooks"
   - Ajoutez un nouveau webhook avec l'URL de votre fonction Edge Supabase
   - Sélectionnez les événements à suivre (au minimum "conversation_created" et "conversation_updated")

3. **Exécuter la migration SQL** :
   - La migration `20250522000000_add_chat_conversations_table.sql` crée la table nécessaire
   - Exécutez-la via l'interface SQL de Supabase ou via la CLI

## Personnalisation avancée

### Personnalisation de l'apparence

Vous pouvez personnaliser l'apparence du widget dans les paramètres de la boîte de réception ou directement dans le code :

```javascript
// Dans ChatwootWidget.tsx
window.chatwootSettings = {
  hideMessageBubble: false,
  position: 'right', // ou 'left'
  locale: 'fr',
  type: 'standard', // ou 'expanded_bubble'
  launcherTitle: 'Besoin d\'aide?',
  showPopoutButton: true,
  darkMode: 'auto', // ou 'light' ou 'dark'
};
```

### Intégration avec l'authentification

Le widget est déjà configuré pour identifier les utilisateurs connectés. Lorsqu'un utilisateur se connecte, ses informations sont transmises à Chatwoot.

### Ajout de métadonnées personnalisées

Vous pouvez ajouter des métadonnées personnalisées pour chaque utilisateur :

```javascript
window.$chatwoot.setCustomAttributes({
  userType: 'member',
  plan: 'premium',
  memberSince: '2023-01-15'
});
```

### Déclenchement d'actions spécifiques

Vous pouvez déclencher des actions spécifiques depuis votre code :

```javascript
// Ouvrir la fenêtre de chat
window.$chatwoot.toggle();

// Réinitialiser la conversation
window.$chatwoot.reset();

// Définir la langue
window.$chatwoot.setLocale('en');
```

## Dépannage

### Le widget ne s'affiche pas

- Vérifiez que le token du site web est correct
- Assurez-vous que le script Chatwoot est correctement chargé (vérifiez la console du navigateur)
- Vérifiez que la boîte de réception est active dans Chatwoot

### Les notifications ne fonctionnent pas

- Vérifiez que les notifications sont activées dans les paramètres du navigateur
- Assurez-vous que les notifications sont activées dans les paramètres de Chatwoot

### Problèmes avec les webhooks

- Vérifiez les journaux de la fonction Edge Supabase
- Assurez-vous que l'URL du webhook est correcte et accessible
- Vérifiez que les événements appropriés sont sélectionnés dans Chatwoot

### Erreurs TypeScript dans les fonctions Edge

Si vous voyez des erreurs TypeScript dans les fichiers de fonctions Edge Supabase (comme `chatwoot-webhook/index.ts`), ne vous inquiétez pas. Ces erreurs sont normales dans l'éditeur VS Code car il ne reconnaît pas par défaut les types et imports spécifiques à Deno :

```
Cannot find module 'http/server' or its corresponding type declarations.
Cannot find name 'Deno'.
```

Ces erreurs n'affecteront pas la fonctionnalité lorsque la fonction sera déployée sur Supabase Edge Functions, qui utilise l'environnement d'exécution Deno. Vous pouvez ignorer ces erreurs ou installer l'extension Deno pour VS Code pour les résoudre.
