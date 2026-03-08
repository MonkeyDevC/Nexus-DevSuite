# Añade Node.js al PATH de esta sesión y ejecuta el setup de la base de datos.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/run-db-setup.ps1
# O desde la raíz: .\scripts\run-db-setup.ps1

$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$env:PATH"
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

& node scripts/setup-database.js
exit $LASTEXITCODE
