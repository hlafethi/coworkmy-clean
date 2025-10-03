#!/bin/bash

# Script de déploiement pour CoworkMy
# Usage: ./deploy.sh

set -e

echo "🚀 Déploiement de CoworkMy sur VPS"
echo "=================================="

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que Docker Compose est installé
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier que le fichier .env.production existe
if [ ! -f "env.production" ]; then
    echo "❌ Le fichier env.production n'existe pas."
    echo "📝 Créez le fichier env.production avec vos vraies clés."
    exit 1
fi

echo "📋 Étapes de déploiement :"
echo "1. Arrêt des conteneurs existants"
echo "2. Construction de l'image Docker"
echo "3. Démarrage des services"
echo "4. Vérification du déploiement"
echo ""

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
docker-compose down --remove-orphans || true

# Construire l'image
echo "🔨 Construction de l'image Docker..."
docker-compose build --no-cache

# Démarrer les services
echo "🚀 Démarrage des services..."
docker-compose up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier le statut des conteneurs
echo "📊 Statut des conteneurs :"
docker-compose ps

# Vérifier la connectivité
echo "🔍 Vérification de la connectivité..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Application accessible sur http://localhost:3000"
else
    echo "❌ Application non accessible. Vérifiez les logs :"
    docker-compose logs coworkmy-app
fi

echo ""
echo "🎉 Déploiement terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Configurez Nginx Proxy Manager pour le domaine coworkmy.fr"
echo "2. Configurez SSL avec Let's Encrypt"
echo "3. Testez l'application sur https://coworkmy.fr"
echo ""
echo "🔧 Commandes utiles :"
echo "- Voir les logs : docker-compose logs -f"
echo "- Redémarrer : docker-compose restart"
echo "- Arrêter : docker-compose down"
echo "- Mettre à jour : git pull && docker-compose up -d --build"