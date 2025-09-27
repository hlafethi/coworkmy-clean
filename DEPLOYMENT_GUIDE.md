# Guide de Déploiement CoWorkMy

## 🚀 Déploiement Rapide

### 1. Build de l'application
```bash
npm run build
```

### 2. Fichiers générés
Le build génère un dossier `dist/` contenant :
- `index.html` - Page principale de l'application
- `assets/` - Fichiers CSS, JS et autres ressources
- `.htaccess` - Configuration Apache
- `web.config` - Configuration IIS
- `manifest.json` - PWA manifest
- `service-worker.js` - Service Worker pour le cache
- `robots.txt` - Configuration SEO
- `sitemap.xml` - Sitemap pour les moteurs de recherche

## 🌐 Configuration Serveur

### Apache (.htaccess)
Le fichier `.htaccess` est automatiquement inclus et configure :
- ✅ Redirection SPA (toutes les routes vers index.html)
- ✅ Compression Gzip
- ✅ Cache des ressources statiques
- ✅ Headers de sécurité
- ✅ Protection contre les attaques XSS
- ✅ Content Security Policy

### IIS (web.config)
Le fichier `web.config` configure :
- ✅ Redirection SPA
- ✅ Compression HTTP
- ✅ Headers de sécurité
- ✅ Cache des ressources
- ✅ Protection des fichiers sensibles

## 🔧 Configuration Avancée

### Variables d'environnement
Assurez-vous que ces variables sont configurées sur votre serveur :
```bash
VITE_SUPABASE_URL=https://exffryodynkyizbeesbt.supabase.co
VITE_SUPABASE_ANON_KEY=votre_clé_anon_supabase
```

### SSL/HTTPS
Pour activer HTTPS, décommentez ces lignes dans `.htaccess` :
```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### Content Security Policy
Ajustez la CSP dans `.htaccess` selon vos besoins :
```apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://exffryodynkyizbeesbt.supabase.co https://api.stripe.com https://maps.googleapis.com; frame-src 'self' https://js.stripe.com;"
```

## 📊 Optimisations

### Performance
- ✅ Compression Gzip activée
- ✅ Cache des ressources statiques (1 an)
- ✅ Cache HTML (1 heure)
- ✅ Code splitting automatique
- ✅ Minification et optimisation

### Sécurité
- ✅ Protection XSS
- ✅ Protection contre le clickjacking
- ✅ Protection MIME type sniffing
- ✅ Content Security Policy
- ✅ Protection des fichiers sensibles

### SEO
- ✅ Meta tags optimisés
- ✅ Sitemap XML
- ✅ Robots.txt
- ✅ PWA manifest
- ✅ Service Worker pour le cache

## 🐛 Dépannage

### Problèmes courants

#### 1. Routes ne fonctionnent pas
Vérifiez que le fichier `.htaccess` est présent et que mod_rewrite est activé :
```bash
# Test Apache
curl -I http://votre-domaine.com/une-route
# Doit retourner 200 et non 404
```

#### 2. Assets non trouvés
Vérifiez les permissions des fichiers :
```bash
chmod 644 dist/assets/*
chmod 644 dist/*.html
```

#### 3. Erreurs CORS
Vérifiez la configuration Supabase et les domaines autorisés.

#### 4. Service Worker ne fonctionne pas
Assurez-vous que HTTPS est activé (requis pour les SW).

## 📈 Monitoring

### Logs à surveiller
- Erreurs 404 sur les routes
- Erreurs de chargement des assets
- Erreurs Supabase
- Erreurs Stripe

### Métriques importantes
- Temps de chargement initial
- Temps de chargement des pages
- Taux d'erreur
- Performance Core Web Vitals

## 🔄 Mise à jour

### Processus de mise à jour
1. Faire un backup de la version actuelle
2. Build de la nouvelle version
3. Remplacer les fichiers sur le serveur
4. Vider le cache navigateur
5. Tester toutes les fonctionnalités

### Rollback
En cas de problème, restaurez le backup :
```bash
# Restaurer depuis le backup
cp -r backups/production_YYYYMMDD_HHMMSS/* public_html/
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs du serveur
2. Testez en mode développement
3. Consultez la documentation Supabase
4. Contactez l'équipe de développement

---

**CoWorkMy** - Espace de coworking moderne et sécurisé 