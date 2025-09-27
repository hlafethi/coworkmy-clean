#!/bin/bash

# 🚀 Script de Déploiement Optimisé - CoWorkMy
# Version: 2.0 - Avec corrections synchronisation admin

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement CoWorkMy - Version Optimisée"
echo "=========================================="

# Configuration
PROJECT_NAME="CoWorkMy"
BUILD_DIR="dist"
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
DEPLOY_DIR="/var/www/html"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] ℹ️  $1${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js n'est pas installé"
        exit 1
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        error "npm n'est pas installé"
        exit 1
    fi
    
    # Vérifier les dépendances
    if [ ! -f "package.json" ]; then
        error "package.json non trouvé"
        exit 1
    fi
    
    log "✅ Prérequis vérifiés"
}

# Nettoyage et installation
setup_environment() {
    log "Configuration de l'environnement..."
    
    # Nettoyer les modules node_modules si nécessaire
    if [ -d "node_modules" ]; then
        warn "Nettoyage des modules existants..."
        rm -rf node_modules
    fi
    
    # Installer les dépendances
    log "Installation des dépendances..."
    npm ci --production=false
    
    log "✅ Environnement configuré"
}

# Build de l'application
build_application() {
    log "Construction de l'application..."
    
    # Nettoyer le dossier de build
    if [ -d "$BUILD_DIR" ]; then
        rm -rf "$BUILD_DIR"
    fi
    
    # Build en mode production
    npm run build
    
    # Vérifier que le build a réussi
    if [ ! -f "$BUILD_DIR/index.html" ]; then
        error "Échec du build - index.html non trouvé"
        exit 1
    fi
    
    log "✅ Application construite avec succès"
}

# Création des fichiers de configuration serveur
create_server_configs() {
    log "Création des configurations serveur..."
    
    # .htaccess pour Apache
    cat > "$BUILD_DIR/.htaccess" << 'EOF'
# Configuration Apache pour CoWorkMy
RewriteEngine On

# Redirection HTTPS (décommenter si SSL disponible)
# RewriteCond %{HTTPS} off
# RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Gestion des routes SPA
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [L]

# Headers de sécurité
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Content Security Policy optimisée
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"

# Cache control pour les assets
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Pas de cache pour HTML
<FilesMatch "\.(html)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>

# Compression Gzip
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Protection contre les attaques
<IfModule mod_rewrite.c>
    RewriteCond %{QUERY_STRING} (\<|%3C).*script.*(\>|%3E) [NC,OR]
    RewriteCond %{QUERY_STRING} GLOBALS(=|\[|\%[0-9A-Z]{0,2}) [OR]
    RewriteCond %{QUERY_STRING} _REQUEST(=|\[|\%[0-9A-Z]{0,2}) [OR]
    RewriteCond %{QUERY_STRING} proc/self/environ [OR]
    RewriteCond %{QUERY_STRING} mosConfig [OR]
    RewriteCond %{QUERY_STRING} base64_(en|de)code[^(]*\([^)]*\) [OR]
    RewriteCond %{QUERY_STRING} (<|%3C)([^s]*s)+cript.*(>|%3E) [NC,OR]
    RewriteCond %{QUERY_STRING} (\<|%3C).*iframe.*(\>|%3E) [NC]
    RewriteRule .* - [F]
</IfModule>
EOF

    # web.config pour IIS
    cat > "$BUILD_DIR/web.config" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="SPA Routes" stopProcessing="true">
                    <match url=".*" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="/index.html" />
                </rule>
            </rules>
        </rewrite>
        
        <httpProtocol>
            <customHeaders>
                <add name="X-Content-Type-Options" value="nosniff" />
                <add name="X-Frame-Options" value="DENY" />
                <add name="X-XSS-Protection" value="1; mode=block" />
                <add name="Referrer-Policy" value="strict-origin-when-cross-origin" />
                <add name="Content-Security-Policy" value="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://js.stripe.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';" />
            </customHeaders>
        </httpProtocol>
        
        <staticContent>
            <mimeMap fileExtension=".webmanifest" mimeType="application/manifest+json" />
        </staticContent>
        
        <caching>
            <profiles>
                <add extension=".js" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".css" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".png" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".jpg" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".gif" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".ico" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".svg" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".woff" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".woff2" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".ttf" policy="CacheForTimePeriod" duration="00:01:00:00" />
                <add extension=".eot" policy="CacheForTimePeriod" duration="00:01:00:00" />
            </profiles>
        </caching>
    </system.webServer>
</configuration>
EOF

    # robots.txt
    cat > "$BUILD_DIR/robots.txt" << 'EOF'
User-agent: *
Allow: /

Sitemap: https://votre-domaine.com/sitemap.xml
EOF

    # sitemap.xml basique
    cat > "$BUILD_DIR/sitemap.xml" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://votre-domaine.com/</loc>
        <lastmod>2024-01-01</lastmod>
        <changefreq>weekly</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://votre-domaine.com/spaces</loc>
        <lastmod>2024-01-01</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://votre-domaine.com/contact</loc>
        <lastmod>2024-01-01</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
</urlset>
EOF

    log "✅ Configurations serveur créées"
}

# Sauvegarde de l'ancienne version
backup_current_version() {
    if [ -d "$DEPLOY_DIR" ]; then
        log "Sauvegarde de la version actuelle..."
        mkdir -p "$BACKUP_DIR"
        cp -r "$DEPLOY_DIR"/* "$BACKUP_DIR/" 2>/dev/null || true
        log "✅ Sauvegarde créée dans $BACKUP_DIR"
    else
        warn "Aucune version existante à sauvegarder"
    fi
}

# Déploiement
deploy_application() {
    log "Déploiement de l'application..."
    
    # Créer le dossier de déploiement si nécessaire
    mkdir -p "$DEPLOY_DIR"
    
    # Copier les fichiers
    cp -r "$BUILD_DIR"/* "$DEPLOY_DIR/"
    
    # Définir les permissions
    chmod -R 755 "$DEPLOY_DIR"
    chmod 644 "$DEPLOY_DIR"/*.html
    chmod 644 "$DEPLOY_DIR"/*.css
    chmod 644 "$DEPLOY_DIR"/*.js
    
    log "✅ Application déployée"
}

# Vérification post-déploiement
verify_deployment() {
    log "Vérification du déploiement..."
    
    # Vérifier les fichiers essentiels
    local essential_files=("index.html" ".htaccess" "web.config")
    
    for file in "${essential_files[@]}"; do
        if [ ! -f "$DEPLOY_DIR/$file" ]; then
            error "Fichier manquant: $file"
            return 1
        fi
    done
    
    # Vérifier la taille du build
    local build_size=$(du -sh "$DEPLOY_DIR" | cut -f1)
    log "✅ Taille du déploiement: $build_size"
    
    log "✅ Déploiement vérifié"
}

# Nettoyage
cleanup() {
    log "Nettoyage..."
    
    # Supprimer les anciennes sauvegardes (garder les 5 plus récentes)
    find . -maxdepth 1 -name "backup-*" -type d | sort -r | tail -n +6 | xargs rm -rf 2>/dev/null || true
    
    # Nettoyer les modules de développement
    if [ -d "node_modules" ]; then
        warn "Nettoyage des modules de développement..."
        npm prune --production
    fi
    
    log "✅ Nettoyage terminé"
}

# Affichage des informations de déploiement
show_deployment_info() {
    echo ""
    echo "🎉 Déploiement terminé avec succès !"
    echo "=================================="
    echo "📁 Dossier de déploiement: $DEPLOY_DIR"
    echo "📦 Taille: $(du -sh "$DEPLOY_DIR" | cut -f1)"
    echo "🔄 Sauvegarde: $BACKUP_DIR"
    echo ""
    echo "🔧 Prochaines étapes:"
    echo "1. Vérifier l'accès à l'application"
    echo "2. Tester la connexion admin"
    echo "3. Vérifier les performances"
    echo "4. Configurer le monitoring"
    echo ""
    echo "📋 Scripts SQL disponibles:"
    echo "- debug-admin-sync.sql (diagnostic)"
    echo "- fix-admin-sync-issue.sql (correction)"
    echo ""
    echo "📖 Documentation: RESOLUTION_SYNCHRONISATION_ADMIN.md"
}

# Fonction principale
main() {
    echo "🚀 Démarrage du déploiement CoWorkMy..."
    echo "======================================"
    
    check_prerequisites
    setup_environment
    build_application
    create_server_configs
    backup_current_version
    deploy_application
    verify_deployment
    cleanup
    show_deployment_info
    
    echo ""
    log "✅ Déploiement terminé avec succès !"
}

# Gestion des erreurs
trap 'error "Erreur lors du déploiement. Vérifiez les logs ci-dessus."; exit 1' ERR

# Exécution
main "$@" 