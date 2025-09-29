@echo off
echo 🚀 Démarrage de l'application CoworkMy
echo.

echo 📊 Démarrage du serveur API...
start "API Server" cmd /k "node api-server.js"

echo ⏳ Attente du démarrage de l'API...
timeout /t 3 /nobreak > nul

echo 🌐 Démarrage du serveur de développement...
start "Dev Server" cmd /k "npm run dev"

echo.
echo ✅ Application démarrée !
echo 📊 API: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo.
echo Appuyez sur une touche pour fermer...
pause > nul
