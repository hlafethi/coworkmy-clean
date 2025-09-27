# Guide de Déploiement et Infrastructure

Ce document détaille les étapes et les meilleures pratiques pour déployer, sécuriser et maintenir l'application Canard Coworking Space en production.

## Table des matières

1. [Configuration HTTPS](#configuration-https)
2. [CI/CD (Intégration Continue / Déploiement Continu)](#cicd)
3. [Stratégie de Backup des Données](#strategie-de-backup)
4. [Plan de Reprise d'Activité (PRA)](#plan-de-reprise)
5. [Environnements de Staging/Production](#environnements)
6. [Documentation](#documentation)

## Configuration HTTPS <a name="configuration-https"></a>

La sécurisation des communications entre les utilisateurs et le serveur est essentielle pour protéger les données sensibles.

### Obtention d'un certificat SSL/TLS

1. **Let's Encrypt (recommandé)**
   - Gratuit et automatiquement renouvelable
   - Installation via Certbot :
     ```bash
     sudo apt-get update
     sudo apt-get install certbot
     sudo certbot certonly --webroot -w /var/www/html -d votredomaine.com -d www.votredomaine.com
     ```
   - Configuration du renouvellement automatique :
     ```bash
     sudo crontab -e
     # Ajouter la ligne suivante pour vérifier et renouveler deux fois par jour
     0 */12 * * * certbot renew --quiet
     ```

2. **Configuration Nginx**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name votredomaine.com www.votredomaine.com;

       ssl_certificate /etc/letsencrypt/live/votredomaine.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/votredomaine.com/privkey.pem;
       ssl_trusted_certificate /etc/letsencrypt/live/votredomaine.com/chain.pem;

       # Paramètres de sécurité recommandés
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
       ssl_session_cache shared:SSL:10m;
       ssl_session_timeout 1d;
       ssl_stapling on;
       ssl_stapling_verify on;

       # HSTS (recommandé, mais à activer avec précaution)
       add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

       # Autres en-têtes de sécurité
       add_header X-Content-Type-Options nosniff;
       add_header X-Frame-Options DENY;
       add_header X-XSS-Protection "1; mode=block";

       # Configuration de l'application
       location / {
           proxy_pass http://localhost:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

   # Redirection HTTP vers HTTPS
   server {
       listen 80;
       server_name votredomaine.com www.votredomaine.com;
       return 301 https://$host$request_uri;
   }
   ```

3. **Test de la configuration SSL**
   - Utiliser [SSL Labs](https://www.ssllabs.com/ssltest/) pour vérifier la configuration
   - Viser une note A+ pour une sécurité optimale

## CI/CD (Intégration Continue / Déploiement Continu) <a name="cicd"></a>

La mise en place d'un pipeline CI/CD automatise les tests et le déploiement, garantissant la qualité et la fiabilité du code.

### GitHub Actions (recommandé)

1. **Configuration du workflow**
   
   Créer un fichier `.github/workflows/main.yml` :

   ```yaml
   name: CI/CD Pipeline

   on:
     push:
       branches: [ main, develop ]
     pull_request:
       branches: [ main, develop ]

   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
         - name: Install dependencies
           run: npm ci
         - name: Run linter
           run: npm run lint
         - name: Run tests
           run: npm test
         - name: Run accessibility tests
           run: npm run test:a11y

     build:
       needs: test
       runs-on: ubuntu-latest
       if: github.event_name == 'push'
       steps:
         - uses: actions/checkout@v3
         - name: Set up Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
         - name: Install dependencies
           run: npm ci
         - name: Build
           run: npm run build
         - name: Upload build artifacts
           uses: actions/upload-artifact@v3
           with:
             name: build
             path: dist/

     deploy-staging:
       needs: build
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/develop'
       steps:
         - uses: actions/download-artifact@v3
           with:
             name: build
             path: dist/
         - name: Deploy to Staging
           uses: appleboy/scp-action@master
           with:
             host: ${{ secrets.STAGING_HOST }}
             username: ${{ secrets.STAGING_USERNAME }}
             key: ${{ secrets.STAGING_SSH_KEY }}
             source: "dist/"
             target: "/var/www/staging.votredomaine.com"
         - name: Post-deploy commands
           uses: appleboy/ssh-action@master
           with:
             host: ${{ secrets.STAGING_HOST }}
             username: ${{ secrets.STAGING_USERNAME }}
             key: ${{ secrets.STAGING_SSH_KEY }}
             script: |
               cd /var/www/staging.votredomaine.com
               pm2 restart staging-app

     deploy-production:
       needs: build
       runs-on: ubuntu-latest
       if: github.ref == 'refs/heads/main'
       steps:
         - uses: actions/download-artifact@v3
           with:
             name: build
             path: dist/
         - name: Deploy to Production
           uses: appleboy/scp-action@master
           with:
             host: ${{ secrets.PRODUCTION_HOST }}
             username: ${{ secrets.PRODUCTION_USERNAME }}
             key: ${{ secrets.PRODUCTION_SSH_KEY }}
             source: "dist/"
             target: "/var/www/votredomaine.com"
         - name: Post-deploy commands
           uses: appleboy/ssh-action@master
           with:
             host: ${{ secrets.PRODUCTION_HOST }}
             username: ${{ secrets.PRODUCTION_USERNAME }}
             key: ${{ secrets.PRODUCTION_SSH_KEY }}
             script: |
               cd /var/www/votredomaine.com
               pm2 restart production-app
   ```

2. **Configuration des secrets GitHub**
   - Dans le dépôt GitHub, aller dans Settings > Secrets
   - Ajouter les secrets nécessaires :
     - `STAGING_HOST`, `STAGING_USERNAME`, `STAGING_SSH_KEY`
     - `PRODUCTION_HOST`, `PRODUCTION_USERNAME`, `PRODUCTION_SSH_KEY`

3. **Protection des branches**
   - Configurer des règles de protection pour les branches `main` et `develop`
   - Exiger des revues de code avant fusion
   - Exiger que les checks CI passent avant fusion

## Stratégie de Backup des Données <a name="strategie-de-backup"></a>

Une stratégie de sauvegarde robuste est essentielle pour protéger les données contre la perte ou la corruption.

### Supabase (Base de données PostgreSQL)

1. **Sauvegardes automatiques**
   - Activer les sauvegardes automatiques quotidiennes dans le tableau de bord Supabase
   - Configurer la rétention des sauvegardes (recommandé : 30 jours)

2. **Sauvegardes manuelles**
   - Script de sauvegarde PostgreSQL :
     ```bash
     #!/bin/bash
     DATE=$(date +"%Y%m%d")
     DB_NAME="votre_db"
     BACKUP_DIR="/chemin/vers/backups"
     
     # Créer le répertoire de sauvegarde s'il n'existe pas
     mkdir -p $BACKUP_DIR
     
     # Exécuter pg_dump
     PGPASSWORD=votre_mot_de_passe pg_dump -h votre_host -U votre_utilisateur -d $DB_NAME -F c -b -v -f "$BACKUP_DIR/$DB_NAME-$DATE.backup"
     
     # Compresser la sauvegarde
     gzip "$BACKUP_DIR/$DB_NAME-$DATE.backup"
     
     # Supprimer les sauvegardes de plus de 30 jours
     find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
     ```

3. **Stockage externe**
   - Configurer un transfert automatique vers un stockage externe (AWS S3, Google Cloud Storage)
   - Script d'envoi vers S3 :
     ```bash
     #!/bin/bash
     DATE=$(date +"%Y%m%d")
     DB_NAME="votre_db"
     BACKUP_DIR="/chemin/vers/backups"
     S3_BUCKET="nom-de-votre-bucket"
     
     # Envoyer la sauvegarde vers S3
     aws s3 cp "$BACKUP_DIR/$DB_NAME-$DATE.backup.gz" "s3://$S3_BUCKET/database-backups/"
     ```

4. **Vérification des sauvegardes**
   - Script de test de restauration :
     ```bash
     #!/bin/bash
     DATE=$(date +"%Y%m%d")
     DB_NAME="votre_db"
     TEST_DB_NAME="${DB_NAME}_test_restore"
     BACKUP_DIR="/chemin/vers/backups"
     
     # Décompresser la sauvegarde
     gunzip -c "$BACKUP_DIR/$DB_NAME-$DATE.backup.gz" > "$BACKUP_DIR/$DB_NAME-$DATE.backup"
     
     # Créer une base de données de test
     PGPASSWORD=votre_mot_de_passe psql -h votre_host -U votre_utilisateur -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;"
     PGPASSWORD=votre_mot_de_passe psql -h votre_host -U votre_utilisateur -c "CREATE DATABASE $TEST_DB_NAME;"
     
     # Restaurer la sauvegarde
     PGPASSWORD=votre_mot_de_passe pg_restore -h votre_host -U votre_utilisateur -d $TEST_DB_NAME "$BACKUP_DIR/$DB_NAME-$DATE.backup"
     
     # Vérifier la restauration
     PGPASSWORD=votre_mot_de_passe psql -h votre_host -U votre_utilisateur -d $TEST_DB_NAME -c "SELECT count(*) FROM spaces;"
     
     # Nettoyer
     PGPASSWORD=votre_mot_de_passe psql -h votre_host -U votre_utilisateur -c "DROP DATABASE $TEST_DB_NAME;"
     rm "$BACKUP_DIR/$DB_NAME-$DATE.backup"
     ```

## Plan de Reprise d'Activité (PRA) <a name="plan-de-reprise"></a>

Un plan de reprise d'activité définit les procédures à suivre en cas de sinistre pour restaurer les systèmes et minimiser l'impact sur l'activité.

### Documentation du PRA

1. **Analyse des risques**
   - Identifier les scénarios de sinistre potentiels
   - Évaluer l'impact de chaque scénario
   - Définir les objectifs de temps de reprise (RTO) et de point de reprise (RPO)

2. **Procédures de reprise**

   **Scénario 1 : Panne de serveur**
   ```
   1. Activer un serveur de secours (si configuré)
   2. Restaurer la dernière sauvegarde de la base de données
   3. Déployer la dernière version de l'application
   4. Vérifier la connectivité et les fonctionnalités
   5. Rediriger le trafic vers le nouveau serveur
   ```

   **Scénario 2 : Corruption de données**
   ```
   1. Identifier l'étendue de la corruption
   2. Isoler les systèmes affectés
   3. Restaurer la dernière sauvegarde valide
   4. Vérifier l'intégrité des données
   5. Réactiver les systèmes
   ```

   **Scénario 3 : Attaque de sécurité**
   ```
   1. Isoler les systèmes compromis
   2. Évaluer l'étendue de la compromission
   3. Restaurer à partir d'une sauvegarde antérieure à la compromission
   4. Appliquer les correctifs de sécurité nécessaires
   5. Effectuer une analyse de sécurité complète avant de remettre en service
   ```

3. **Tests réguliers**
   - Planifier des exercices de reprise trimestriels
   - Documenter les résultats et les leçons apprises
   - Mettre à jour le PRA en fonction des résultats

## Environnements de Staging/Production <a name="environnements"></a>

La séparation des environnements permet de tester les modifications avant de les déployer en production.

### Configuration des environnements

1. **Structure recommandée**
   ```
   - Développement (local) : Pour le développement individuel
   - Staging : Pour les tests d'intégration et d'acceptation
   - Production : Pour les utilisateurs finaux
   ```

2. **Configuration de l'environnement de staging**
   - Domaine : `staging.votredomaine.com`
   - Configuration Nginx similaire à la production
   - Base de données séparée mais avec une structure identique
   - Variables d'environnement spécifiques :
     ```
     NODE_ENV=staging
     VITE_API_URL=https://staging-api.votredomaine.com
     VITE_SUPABASE_URL=https://votreid.supabase.co
     VITE_SUPABASE_ANON_KEY=votre-clé-anon-staging
     ```

3. **Configuration de l'environnement de production**
   - Domaine : `votredomaine.com`
   - Optimisations de performance :
     - Mise en cache des ressources statiques
     - Compression gzip/brotli
     - CDN pour les assets
   - Variables d'environnement :
     ```
     NODE_ENV=production
     VITE_API_URL=https://api.votredomaine.com
     VITE_SUPABASE_URL=https://votreid.supabase.co
     VITE_SUPABASE_ANON_KEY=votre-clé-anon-production
     ```

4. **Procédure de promotion**
   ```
   1. Déploiement en staging
   2. Tests automatisés et manuels en staging
   3. Approbation par les parties prenantes
   4. Déploiement en production
   5. Vérification post-déploiement
   ```

## Documentation <a name="documentation"></a>

Une documentation complète est essentielle pour maintenir et faire évoluer l'application.

### Structure de la documentation

1. **Documentation technique**
   - Architecture du système
   - Diagrammes (architecture, base de données, flux de données)
   - Guide d'installation et de configuration
   - Guide de déploiement (ce document)
   - API et intégrations

2. **Documentation utilisateur**
   - Guide d'utilisation
   - FAQ
   - Procédures pour les administrateurs
   - Procédures pour les utilisateurs

3. **Documentation de maintenance**
   - Procédures de surveillance
   - Procédures de sauvegarde et restauration
   - Procédures de mise à jour
   - Journal des modifications

4. **Outils recommandés**
   - Documentation technique : Markdown dans le dépôt Git
   - Documentation API : Swagger/OpenAPI
   - Documentation utilisateur : Gitbook ou Notion

### Exemple de structure de documentation dans le dépôt

```
/docs
  /api
    - swagger.yaml
    - authentication.md
    - endpoints.md
  /architecture
    - overview.md
    - database.md
    - components.md
  /deployment
    - setup.md
    - ci-cd.md
    - monitoring.md
  /development
    - getting-started.md
    - coding-standards.md
    - testing.md
  /maintenance
    - backup.md
    - updates.md
    - troubleshooting.md
  /user
    - admin-guide.md
    - user-guide.md
```

---

Ce document est un guide vivant qui doit être mis à jour régulièrement pour refléter les changements dans l'infrastructure et les procédures de déploiement.

Dernière mise à jour : 2 mai 2025
