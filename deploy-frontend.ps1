# Script de déploiement du frontend
Write-Host "🚀 Déploiement du frontend..." -ForegroundColor Green

# Vérifier que le build existe
if (-not (Test-Path "dist")) {
    Write-Host "❌ Le dossier dist n'existe pas. Lancez 'npm run build' d'abord." -ForegroundColor Red
    exit 1
}

# Copier les fichiers vers le VPS
Write-Host "📁 Copie des fichiers vers le VPS..." -ForegroundColor Yellow
scp -r dist/* root@147.93.58.155:/opt/coworkmy/

Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host "🌐 L'application est accessible sur : http://147.93.58.155:3002" -ForegroundColor Cyan
