#!/bin/bash

# Script de déploiement pour CoWorkMy
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BUILD_DIR="dist"
BACKUP_DIR="backups/${ENVIRONMENT}_${TIMESTAMP}"

echo "🚀 Déploiement CoWorkMy - Environnement: $ENVIRONMENT"
echo "⏰ Timestamp: $TIMESTAMP"
echo ""

# Vérification des prérequis
echo "📋 Vérification des prérequis..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé"
    exit 1
fi

echo "✅ Prérequis vérifiés"
echo ""

# Nettoyage et installation des dépendances
echo "📦 Installation des dépendances..."
npm ci --silent
echo "✅ Dépendances installées"
echo ""

# Build de l'application
echo "🔨 Build de l'application..."
npm run build
echo "✅ Build terminé"
echo ""

# Vérification des fichiers de configuration
echo "🔍 Vérification des fichiers de configuration..."
if [ ! -f "$BUILD_DIR/.htaccess" ]; then
    echo "❌ Fichier .htaccess manquant"
    exit 1
fi

if [ ! -f "$BUILD_DIR/web.config" ]; then
    echo "❌ Fichier web.config manquant"
    exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ]; then
    echo "❌ Fichier index.html manquant"
    exit 1
fi

echo "✅ Fichiers de configuration vérifiés"
echo ""

# Création du backup si nécessaire
if [ "$ENVIRONMENT" = "production" ]; then
    echo "💾 Création du backup..."
    mkdir -p backups
    if [ -d "public_html" ]; then
        cp -r public_html "$BACKUP_DIR"
        echo "✅ Backup créé: $BACKUP_DIR"
    else
        echo "⚠️  Aucun dossier public_html trouvé pour le backup"
    fi
    echo ""
fi

# Statistiques du build
echo "📊 Statistiques du build:"
echo "   - Taille totale: $(du -sh $BUILD_DIR | cut -f1)"
echo "   - Nombre de fichiers: $(find $BUILD_DIR -type f | wc -l)"
echo "   - Assets JS: $(find $BUILD_DIR/assets -name "*.js" | wc -l)"
echo "   - Assets CSS: $(find $BUILD_DIR/assets -name "*.css" | wc -l)"
echo ""

# Instructions de déploiement
echo "🎯 Instructions de déploiement:"
echo ""
echo "1. Copiez le contenu du dossier '$BUILD_DIR' vers votre serveur web"
echo "2. Assurez-vous que les fichiers .htaccess et web.config sont présents"
echo "3. Configurez votre serveur pour servir les fichiers statiques"
echo "4. Testez l'application en production"
echo ""
echo "📁 Dossier de build: $BUILD_DIR"
echo "🔧 Fichiers de configuration:"
echo "   - .htaccess (Apache)"
echo "   - web.config (IIS)"
echo ""

# Vérification de la sécurité
echo "🔒 Vérification de la sécurité..."
if grep -q "console.log" $BUILD_DIR/assets/*.js; then
    echo "⚠️  Attention: Des console.log sont présents dans le build"
else
    echo "✅ Aucun console.log détecté dans le build"
fi

echo ""
echo "✅ Déploiement préparé avec succès!"
echo "🚀 Prêt pour le déploiement en $ENVIRONMENT" 