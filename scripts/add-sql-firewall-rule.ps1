<#
.SYNOPSIS
    Adds the current public IP address to the Azure SQL server firewall so the API can
    reach the database from this machine.

.DESCRIPTION
    Running the API locally against Azure SQL fails with "Client with IP address '...' is
    not allowed to access the server" until the developer's public IP is allowed. This
    script detects the current public IP and creates (or updates) a named firewall rule.

    Firewall rules are per-IP and go stale whenever the developer's address changes -
    rerun this script when local requests start failing again.

.PARAMETER ResourceGroup
    Resource group containing the SQL server.

.PARAMETER SqlServer
    Azure SQL logical server name (without .database.windows.net).

.PARAMETER RuleName
    Name of the firewall rule. Defaults to "dev-<machine name>".

.PARAMETER SubscriptionId
    Subscription to operate in. Optional if the CLI default is already correct.

.EXAMPLE
    ./scripts/add-sql-firewall-rule.ps1 -ResourceGroup rg-portfolio-dev -SqlServer sql-portfolio-server-dev
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $ResourceGroup,
    [Parameter(Mandatory = $true)] [string] $SqlServer,
    [string] $RuleName = "dev-$env:COMPUTERNAME",
    [string] $SubscriptionId
)

$ErrorActionPreference = 'Stop'

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI ('az') is not installed or not on PATH. Install it and run 'az login' first."
}

if ($SubscriptionId) {
    az account set --subscription $SubscriptionId
    if ($LASTEXITCODE -ne 0) { throw "Failed to set subscription. Run 'az login' first." }
}

Write-Host "Detecting public IP address ..."
$publicIp = (Invoke-RestMethod -Uri 'https://api.ipify.org?format=json').ip
if (-not $publicIp) { throw "Could not determine the current public IP address." }
Write-Host "Public IP: $publicIp"

Write-Host "Creating or updating firewall rule '$RuleName' on '$SqlServer' ..."
az sql server firewall-rule create `
    --resource-group $ResourceGroup `
    --server $SqlServer `
    --name $RuleName `
    --start-ip-address $publicIp `
    --end-ip-address $publicIp `
    --output none
if ($LASTEXITCODE -ne 0) { throw "Failed to create the firewall rule." }

Write-Host "Firewall rule '$RuleName' now allows $publicIp." -ForegroundColor Green
Write-Host "Changes can take up to five minutes to take effect."
