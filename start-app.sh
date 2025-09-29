#!/bin/bash

echo "🚀 Démarrage de l'application CoworkMy"
echo

echo "📊 Démarrage du serveur API..."
node api-server.js &
API_PID=$!

echo "⏳ Attente du démarrage de l'API..."
sleep 3

echo "🌐 Démarrage du serveur de développement..."
npm run dev &
DEV_PID=$!

echo
echo "✅ Application démarrée !"
echo "📊 API: http://localhost:5000"
echo "🌐 Frontend: http://localhost:5173"
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
