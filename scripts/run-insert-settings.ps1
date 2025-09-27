$uri = "https://exffryodynkyizbeesbt.supabase.co/functions/v1/insert-default-settings"
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4ZmZyeW9keW5reWl6YmVlc2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"
}

try {
    $response = Invoke-RestMethod -Uri $uri -Method POST -Headers $headers
    Write-Host "Success: $($response.message)"
    Write-Host "Settings inserted:"
    $response.settings | ForEach-Object {
        Write-Host "  - $($_.key): $($_.value | ConvertTo-Json -Compress)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Details: $responseBody"
    }
} 