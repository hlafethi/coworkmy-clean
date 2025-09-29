#!/bin/bash

echo "🚀 Démarrage complet de CoworkMy"
echo "================================"

echo
echo "📋 Vérification des prérequis..."

echo "✅ Node.js version:"
node --version

echo "✅ npm version:"
npm --version

echo
echo "📊 Démarrage du serveur API..."
node api-server.js &
API_PID=$!

echo "⏳ Attente du démarrage de l'API (5 secondes)..."
sleep 5

echo
echo "🧪 Test de l'API..."
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo "✅ API fonctionnelle"
else
    echo "❌ API non accessible"
    echo "⏳ Attente supplémentaire..."
    sleep 3
fi

echo
echo "🌐 Démarrage du serveur de développement..."
npm run dev &
DEV_PID=$!

echo
echo "✅ Application démarrée avec succès !"
echo
echo "📊 URLs d'accès:"
echo "   🌐 Frontend: http://localhost:5173"
echo "   📊 API: http://localhost:5000"
echo "   🧪 Test API: http://localhost:5000/api/health"
echo
echo "💡 Pour créer un administrateur:"
echo "   1. Inscrivez-vous via l'interface"
echo "   2. Exécutez sur votre VPS:"
echo "      UPDATE profiles SET is_admin = true WHERE email = 'votre@email.com';"
echo

# Fonction de nettoyage
cleanup() {
    echo "🛑 Arrêt des serveurs..."
    kill $API_PID 2>/dev/null
    kill $DEV_PID 2>/dev/null
    exit 0
}

# Capturer Ctrl+C
trap cleanup SIGINT

# Attendre
wait
