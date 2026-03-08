$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectPath

# Asegurar que Node.js/npx esten en PATH (reciente instalacion)
$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$env:PATH"
}

Write-Host "Verificando puerto 3000..."

$port = 3000
$connections = netstat -ano | findstr ":$port"

if ($connections) {
    $lines = $connections -split "`n"
    $processIds = @()

    foreach ($line in $lines) {
        if ($line -match "LISTENING\s+(\d+)$") {
            $processIds += $matches[1]
        }
    }

    $processIds = $processIds | Select-Object -Unique

    foreach ($procId in $processIds) {
        Write-Host "Puerto $port en uso por PID $procId. Cerrando proceso..."
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }

    Start-Sleep -Seconds 1
}
else {
    Write-Host "Puerto 3000 libre."
}

Write-Host "Iniciando servidor limpio..."
npx nodemon src/server.js
