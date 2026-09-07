<#
.SYNOPSIS
    Stops the Mini Steam Docker stack.

.DESCRIPTION
    Stops and removes the containers. Database and blob data survive in named volumes
    unless -Purge is supplied.

.PARAMETER Purge
    Also delete the SQL and Azurite volumes. The next start re-migrates and re-seeds from
    an empty database.

.EXAMPLE
    ./scripts/down.ps1

.EXAMPLE
    ./scripts/down.ps1 -Purge
#>
[CmdletBinding()]
param(
    [switch] $Purge
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
    $composeArgs = @('compose', 'down')
    if ($Purge) {
        Write-Host "Removing containers AND volumes - all local data will be lost." -ForegroundColor Yellow
        $composeArgs += '--volumes'
    }

    & docker @composeArgs
    if ($LASTEXITCODE -ne 0) { throw "docker compose down failed." }

    Write-Host "Stack stopped." -ForegroundColor Green
}
finally {
    Pop-Location
}
