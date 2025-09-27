# Guide de déploiement

## Prérequis
- Node.js 18+
- npm ou yarn
- Compte Supabase
- Compte Stripe (pour les paiements)
- Hébergement o2switch

## Étapes de déploiement

### 1. Construction de l'application
```bash
# Installation des dépendances
npm install

# Construction de l'application
npm run build

# Préparation pour o2switch
npm run prepare:o2switch
```

La commande `npm run prepare:o2switch` exécute les scripts suivants :
- `modify-index-html.ps1` (Windows) ou `modify-index-html.sh` (Linux/Mac)
- Ces scripts modifient le fichier `index.html` pour ajouter les scripts nécessaires au fonctionnement de l'application sur o2switch
- Ils créent également les fichiers suivants :
  - `env.js` : Variables d'environnement
  - `disable-sentry.js` : Désactive Sentry en production
  - `.htaccess` : Configuration Apache pour SPA

### 2. Configuration de Supabase

#### Création d'un projet Supabase
1. Créer un compte sur [Supabase](https://supabase.com/)
2. Créer un nouveau projet
3. Noter l'URL et la clé anon du projet

#### Exécution des migrations
1. Installer l'outil CLI de Supabase
```bash
npm install -g supabase
```

2. Se connecter à Supabase
```bash
supabase login
```

3. Lier le projet
```bash
supabase link --project-ref <project-ref>
```

4. Exécuter les migrations
```bash
supabase db push
```

#### Configuration des Edge Functions
1. Déployer les Edge Functions
```bash
supabase functions deploy
```

2. Configurer les variables d'environnement pour les Edge Functions
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SMTP_HOST=smtp.example.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=user@example.com
supabase secrets set SMTP_PASS=password
```

### 3. Configuration de Stripe

#### Création d'un compte Stripe
1. Créer un compte sur [Stripe](https://stripe.com/)
2. Passer en mode test pour le développement

#### Configuration des webhooks
1. Dans le tableau de bord Stripe, aller dans Développeurs > Webhooks
2. Ajouter un endpoint : `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
3. Sélectionner les événements à écouter :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `checkout.session.completed`
4. Noter le secret du webhook

#### Ajout des clés API dans l'application
1. Se connecter à l'application en tant qu'administrateur
2. Aller dans Administration > Configuration des paiements
3. Ajouter les clés API Stripe :
   - Clé publique test
   - Clé secrète test
   - Secret du webhook test
   - Clé publique live
   - Clé secrète live
   - Secret du webhook live
4. Sélectionner le mode (test ou live)

### 4. Déploiement sur o2switch

#### Téléchargement des fichiers
1. Se connecter au FTP d'o2switch
2. Créer un dossier pour l'application (par exemple, `coworking`)
3. Télécharger le contenu du dossier `dist` dans ce dossier

#### Configuration du domaine
1. Dans le panneau d'administration d'o2switch, aller dans Domaines > Sous-domaines
2. Créer un sous-domaine (par exemple, `coworking.example.com`)
3. Pointer le sous-domaine vers le dossier de l'application

#### Configuration des redirections
1. Vérifier que le fichier `.htaccess` est correctement configuré pour rediriger toutes les requêtes vers `index.html`
2. Si nécessaire, modifier le fichier `.htaccess` pour ajouter des règles de redirection supplémentaires

### 5. Vérification du déploiement

#### Tests de base
1. Accéder à l'application via le navigateur
2. Vérifier que la page d'accueil s'affiche correctement
3. Tester l'authentification (connexion et inscription)
4. Tester la réservation d'un espace
5. Tester le paiement (en mode test)

#### Tests avancés
1. Vérifier que les emails sont envoyés correctement
2. Vérifier que les webhooks Stripe fonctionnent
3. Vérifier que les logs sont correctement enregistrés

## Mise à jour de l'application

### 1. Construction de la nouvelle version
```bash
# Mise à jour des dépendances
npm install

# Construction de l'application
npm run build

# Préparation pour o2switch
npm run prepare:o2switch
```

### 2. Sauvegarde de la version actuelle
1. Se connecter au FTP d'o2switch
2. Renommer le dossier actuel (par exemple, `coworking` en `coworking_backup_YYYY-MM-DD`)

### 3. Déploiement de la nouvelle version
1. Créer un nouveau dossier (par exemple, `coworking`)
2. Télécharger le contenu du dossier `dist` dans ce dossier

### 4. Mise à jour de la base de données
1. Exécuter les nouvelles migrations
```bash
supabase db push
```

### 5. Vérification de la mise à jour
1. Accéder à l'application via le navigateur
2. Vérifier que tout fonctionne correctement

## Résolution des problèmes courants

### Erreur 404 sur les routes
- Vérifier que le fichier `.htaccess` est correctement configuré
- Vérifier que le module `mod_rewrite` est activé sur le serveur

### Erreurs CORS
- Vérifier que les en-têtes CORS sont correctement configurés dans les Edge Functions
- Vérifier que le domaine de l'application est autorisé dans la configuration de Supabase

### Erreurs d'authentification
- Vérifier que les clés API Supabase sont correctes dans le fichier `env.js`
- Vérifier que les politiques RLS sont correctement configurées

### Erreurs de paiement
- Vérifier que les clés API Stripe sont correctes
- Vérifier que le webhook Stripe est correctement configuré
- Vérifier les logs Stripe pour plus d'informations sur l'erreur

## Maintenance

### Sauvegardes
- Configurer des sauvegardes régulières de la base de données Supabase
- Utiliser le script `scripts/backup-database.sh` pour sauvegarder la base de données

### Monitoring
- Utiliser le système de logging intégré pour surveiller les erreurs
- Configurer des alertes pour les erreurs critiques

### Mises à jour de sécurité
- Exécuter régulièrement `npm audit` pour vérifier les vulnérabilités
- Mettre à jour les dépendances avec `npm update`
