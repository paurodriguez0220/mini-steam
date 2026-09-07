<#
.SYNOPSIS
    Builds and starts the full Mini Steam stack in Docker.

.DESCRIPTION
    Brings up the API, the Azurite blob emulator, the storefront and the three games. On
    first run the API applies its EF Core migrations and seeds a development user plus the
    three games, so the storefront has something to show.

    The API stores data in SQLite on the api-data volume - no database server, and no
    cloud account.

    Creates .env from .env.example if it does not exist yet.

.PARAMETER Rebuild
    Force a rebuild of every image, ignoring the build cache.

.PARAMETER Detach
    Run in the background and return. Default is $true; use -Detach:$false to stream logs.

.EXAMPLE
    ./scripts/up.ps1

.EXAMPLE
    ./scripts/up.ps1 -Rebuild
#>
[CmdletBinding()]
param(
    [switch] $Rebuild,
    [bool]   $Detach = $true
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker is not installed or not on PATH."
    }

    docker info --format '{{.ServerVersion}}' | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "The Docker daemon is not reachable. Start Docker Desktop and try again."
    }

    if (-not (Test-Path '.env')) {
        Write-Host "No .env found - creating one from .env.example ..." -ForegroundColor Yellow
        Copy-Item '.env.example' '.env'
        Write-Host "Created .env with local development defaults. Review it before continuing." -ForegroundColor Yellow
    }

    $composeArgs = @('compose', 'up')
    if ($Detach)  { $composeArgs += '-d' }
    $composeArgs += '--build'
    if ($Rebuild) { $composeArgs += '--no-cache' }

    Write-Host "Starting the Mini Steam stack ..." -ForegroundColor Cyan
    & docker @composeArgs
    if ($LASTEXITCODE -ne 0) { throw "docker compose up failed." }

    if (-not $Detach) { return }

    # Read the effective ports back out of .env so the printed URLs are correct.
    $envValues = @{}
    Get-Content '.env' | Where-Object { $_ -match '^\s*[^#].*=' } | ForEach-Object {
        $parts = $_.Split('=', 2)
        $envValues[$parts[0].Trim()] = $parts[1].Trim()
    }
    function Get-Port([string] $key, [string] $fallback) {
        if ($envValues.ContainsKey($key) -and $envValues[$key]) { return $envValues[$key] }
        return $fallback
    }

    Write-Host ""
    Write-Host "Mini Steam is up." -ForegroundColor Green
    Write-Host "  Storefront   http://localhost:$(Get-Port 'UI_PORT' '5173')"
    Write-Host "  API docs     http://localhost:$(Get-Port 'API_PORT' '8080')/scalar/v1"
    Write-Host "  2048         http://localhost:$(Get-Port 'GAME_2048_PORT' '5174')"
    Write-Host "  Snake        http://localhost:$(Get-Port 'GAME_SNAKE_PORT' '5175')"
    Write-Host "  Minesweeper  http://localhost:$(Get-Port 'GAME_MINESWEEPER_PORT' '5176')"
    Write-Host ""
    Write-Host "The API seeds the database on first start; give it a few seconds."
    Write-Host "Logs:  ./scripts/logs.ps1     Stop:  ./scripts/down.ps1"
}
finally {
    Pop-Location
}
