<#
.SYNOPSIS
    Rotates the MiniSteam secrets that were exposed in git history and republishes them
    to App Service configuration.

.DESCRIPTION
    Removing a secret from the working tree does not make it safe - it remains in git
    history and must be assumed compromised. This script rotates each affected secret
    and updates the running app so nothing is left pointing at a stale value.

    Rotates:
      1. Azure Storage account key (key1)
      2. Azure SQL administrator password - the application no longer uses this
         database (see docs/decisions/001-use-sqlite.md), but the server may still
         exist in Azure with the exposed password. Rotating is a stopgap; the real
         fix is to decommission the server, which this script deliberately does not
         automate.
      3. JWT signing key (regenerated locally, 64 random bytes, base64)

    Each step prompts before acting unless -Force is supplied.

.PARAMETER ResourceGroup
    Resource group holding the storage account, SQL server and App Service.

.PARAMETER StorageAccount
    Storage account whose key1 is rotated.

.PARAMETER SqlServer
    Azure SQL logical server name (without .database.windows.net).

.PARAMETER SqlAdminUser
    Azure SQL administrator login.

.PARAMETER AppServiceName
    App Service that hosts the API and receives the new settings.

.PARAMETER SubscriptionId
    Subscription to operate in.

.PARAMETER Force
    Skip confirmation prompts.

.EXAMPLE
    ./scripts/rotate-secrets.ps1 -ResourceGroup rg-portfolio-dev `
        -StorageAccount stportfoliogamesdev -SqlServer sql-portfolio-server-dev `
        -SqlAdminUser portfolioAdmin -AppServiceName app-ministeam-dev `
        -SubscriptionId 00000000-0000-0000-0000-000000000000
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)] [string] $ResourceGroup,
    [Parameter(Mandatory = $true)] [string] $StorageAccount,
    [Parameter(Mandatory = $true)] [string] $SqlServer,
    [Parameter(Mandatory = $true)] [string] $SqlAdminUser,
    [Parameter(Mandatory = $true)] [string] $AppServiceName,
    [Parameter(Mandatory = $true)] [string] $SubscriptionId,
    [switch] $Force
)

$ErrorActionPreference = 'Stop'

function Confirm-Step {
    param([string] $Message)
    if ($Force) { return $true }
    $answer = Read-Host "$Message [y/N]"
    return $answer -eq 'y'
}

function New-RandomKey {
    $bytes = New-Object 'System.Byte[]' 64
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return [Convert]::ToBase64String($bytes)
}

if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    throw "Azure CLI ('az') is not installed or not on PATH. Install it and run 'az login' first."
}

Write-Host "Setting subscription $SubscriptionId ..."
az account set --subscription $SubscriptionId
if ($LASTEXITCODE -ne 0) { throw "Failed to set subscription. Run 'az login' first." }

# ---------------------------------------------------------------- storage key
if (Confirm-Step "Rotate storage account key1 on '$StorageAccount'?") {
    Write-Host "Rotating storage key1 ..."
    az storage account keys renew --resource-group $ResourceGroup --account-name $StorageAccount --key key1 --output none
    if ($LASTEXITCODE -ne 0) { throw "Storage key rotation failed." }

    $newKey = az storage account keys list --resource-group $ResourceGroup --account-name $StorageAccount --query "[?keyName=='key1'].value | [0]" --output tsv
    $blobConnectionString = "DefaultEndpointsProtocol=https;AccountName=$StorageAccount;AccountKey=$newKey;EndpointSuffix=core.windows.net"

    Write-Host "Publishing new blob connection string to App Service ..."
    az webapp config appsettings set --resource-group $ResourceGroup --name $AppServiceName --settings "AzureBlobStorage__ConnectionString=$blobConnectionString" --output none
    if ($LASTEXITCODE -ne 0) { throw "Failed to update App Service blob setting." }
    Write-Host "Storage key rotated." -ForegroundColor Green
}

# ------------------------------------------------------------- sql password
if (Confirm-Step "Reset the Azure SQL administrator password on '$SqlServer'? (the app no longer uses this database)") {
    $sqlPassword = New-RandomKey
    Write-Host "Resetting SQL administrator password ..."
    az sql server update --resource-group $ResourceGroup --name $SqlServer --admin-password $sqlPassword --output none
    if ($LASTEXITCODE -ne 0) { throw "SQL password reset failed." }

    # The application moved to SQLite, so nothing is republished here - there is no
    # consumer of this connection string left to update.
    Write-Host "SQL password rotated. The exposed password no longer works." -ForegroundColor Green
    Write-Host "The application does not use this server any more. Consider deleting it:" -ForegroundColor Yellow
    Write-Host "  az sql server delete --resource-group $ResourceGroup --name $SqlServer"
    Write-Host "Review the databases on it before deleting - this is not reversible."
}

# ---------------------------------------------------------------- jwt key
if (Confirm-Step "Rotate the JWT signing key? (invalidates all issued tokens)") {
    $jwtKey = New-RandomKey
    Write-Host "Publishing new JWT signing key to App Service ..."
    az webapp config appsettings set --resource-group $ResourceGroup --name $AppServiceName --settings "Jwt__Key=$jwtKey" --output none
    if ($LASTEXITCODE -ne 0) { throw "Failed to update App Service JWT setting." }
    Write-Host "JWT key rotated. All previously issued tokens are now invalid." -ForegroundColor Green
}

Write-Host ""
Write-Host "Rotation complete." -ForegroundColor Green
Write-Host "Remaining manual follow-up:" -ForegroundColor Yellow
Write-Host "  - Change the seeded application user's password (it was committed in .env)."
Write-Host "  - Confirm GitHub secret scanning is enabled on the repository."
