# Arranca el servidor en modo dev sin depender de npm en el PATH.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/run-dev.ps1
# O desde la raíz: .\scripts\run-dev.ps1

$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:PATH = "$nodePath;$env:PATH"
}

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $projectRoot

& "$projectRoot\dev-clean.ps1"
exit $LASTEXITCODE
