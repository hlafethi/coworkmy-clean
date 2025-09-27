$uri = "https://exffryodynkyizbeesbt.supabase.co/functions/v1/fix-blob-urls"
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZmZyeW9keW5reWl6YmVlc2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"
}

try {
    Write-Host "🔧 Correction des URLs blob en cours..."
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers
    
    Write-Host "✅ $($response.message)"
    Write-Host "📊 Résultat:"
    Write-Host "  - Était une URL blob: $($response.wasBlobUrl)"
    Write-Host "  - Nouvelle URL: $($response.settings.value.hero_background_image)"
    
    Write-Host ""
    Write-Host "🔄 Rechargez maintenant la page d'accueil pour voir l'image !"
    
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Détails: $responseBody"
    }
} 