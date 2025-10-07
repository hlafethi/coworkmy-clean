#!/bin/bash

# Script de déploiement du frontend
echo "🚀 Déploiement du frontend..."

# Vérifier que le build existe
if [ ! -d "dist" ]; then
    echo "❌ Le dossier dist n'existe pas. Lancez 'npm run build' d'abord."
    exit 1
fi

# Copier les fichiers vers le VPS
echo "📁 Copie des fichiers vers le VPS..."
scp -r dist/* root@147.93.58.155:/opt/coworkmy/

echo "✅ Déploiement terminé !"
echo "🌐 L'application est accessible sur : http://147.93.58.155:3002"
