@echo off
echo 🚀 Démarrage complet de CoworkMy
echo ================================

echo.
echo 📋 Vérification des prérequis...

echo ✅ Node.js version:
node --version

echo ✅ npm version:
npm --version

echo.
echo 📊 Démarrage du serveur API...
start "API Server" cmd /k "echo 🚀 API CoworkMy démarrée && node api-server.js"

echo ⏳ Attente du démarrage de l'API (5 secondes)...
timeout /t 5 /nobreak > nul

echo.
echo 🧪 Test de l'API...
curl -s http://localhost:5000/api/health > nul
if %errorlevel% equ 0 (
    echo ✅ API fonctionnelle
) else (
    echo ❌ API non accessible
    echo ⏳ Attente supplémentaire...
    timeout /t 3 /nobreak > nul
)

echo.
echo 🌐 Démarrage du serveur de développement...
start "Dev Server" cmd /k "echo 🌐 Frontend CoworkMy démarré && npm run dev"

echo.
echo ✅ Application démarrée avec succès !
echo.
echo 📊 URLs d'accès:
echo    🌐 Frontend: http://localhost:5173
echo    📊 API: http://localhost:5000
echo    🧪 Test API: http://localhost:5000/api/health
echo.
echo 💡 Pour créer un administrateur:
echo    1. Inscrivez-vous via l'interface
echo    2. Exécutez sur votre VPS:
echo       UPDATE profiles SET is_admin = true WHERE email = 'votre@email.com';
echo.
echo Appuyez sur une touche pour fermer cette fenêtre...
pause > nul
