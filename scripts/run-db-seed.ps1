# Añade Node.js al PATH y ejecuta los seeders de la base de datos.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/run-db-seed.ps1

$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$env:PATH"
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

& npx sequelize-cli db:seed:all
exit $LASTEXITCODE
