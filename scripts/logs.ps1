<#
.SYNOPSIS
    Tails logs from the Mini Steam Docker stack.

.PARAMETER Service
    Limit output to one service: azurite, api, ui, game-2048, game-snake,
    game-minesweeper. Omit for all services.

.EXAMPLE
    ./scripts/logs.ps1

.EXAMPLE
    ./scripts/logs.ps1 -Service api
#>
[CmdletBinding()]
param(
    [ValidateSet('azurite', 'api', 'ui', 'game-2048', 'game-snake', 'game-minesweeper')]
    [string] $Service
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
    $composeArgs = @('compose', 'logs', '--follow', '--tail', '100')
    if ($Service) { $composeArgs += $Service }
    & docker @composeArgs
}
finally {
    Pop-Location
}
