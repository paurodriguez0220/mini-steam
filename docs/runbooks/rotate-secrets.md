# Runbook: Rotate Exposed Secrets

**When to run:** any time a secret reaches source control, a log, or a screenshot - and as
the immediate follow-up to the 2026-09-07 cleanup that removed committed secrets from the
working tree.

## Background

Four secrets were committed to this repository and pushed to GitHub:

| Secret | Where it was |
| --- | --- |
| Azure SQL connection string (with admin password) | `MiniSteam/Infrastructure/Extensions/DependencyInjection.cs` |

| Azure Storage account key | `MiniSteam/appsettings.json` |
| JWT signing key | `MiniSteam/appsettings.json` |
| Application admin email + password | `MiniSteamUI/ministeamui/.env` |

They have been removed from the working tree, but **they remain in git history and must be
treated as compromised.** Removing a secret from history does not undo the exposure.

The application has since moved off Azure SQL to SQLite
(`docs/decisions/001-use-sqlite.md`), so nothing consumes that connection string any more.
The server may still exist in Azure with the exposed password, so it still needs
attention - rotate it, then decommission it.

## Procedure

### 1. Rotate the Azure-side secrets

```powershell
./scripts/rotate-secrets.ps1 `
    -ResourceGroup    <resource-group> `
    -StorageAccount   <storage-account> `
    -SqlServer        <sql-server-name> `
    -SqlAdminUser     <sql-admin-login> `
    -AppServiceName   <app-service-name> `
    -SubscriptionId   <subscription-id>
```

The script prompts before each rotation, then republishes the new values to App Service
configuration so the deployed API keeps working. Run `az login` first.

### 2. Update local development secrets

The script prints the new SQL connection string. Store it locally:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<new value>" --project MiniSteam
dotnet user-secrets set "Jwt:Key" "<new value>" --project MiniSteam
dotnet user-secrets set "AzureBlobStorage:ConnectionString" "<new value>" --project MiniSteam
```

### 3. Decommission the Azure SQL server

Nothing uses it. Once the password is rotated, review its databases and delete the server
deliberately - the script does not automate this because it is not reversible.

### 4. Change the exposed application account password

The admin credentials in the old `.env` were for an application user row in the `Users`
table, not an Azure identity. Change that user's password through the application so a new
BCrypt hash is stored.

### 5. Enable secret scanning

Turn on GitHub secret scanning and push protection for the repository so this is caught at
push time rather than after the fact.

### 6. Decide on history

Rewriting history with `git filter-repo` removes the values from future clones but does not
un-expose them. Rotation in steps 1-3 is what actually makes the old values worthless.
Rewrite history only if you also accept invalidating every existing clone and fork.

## Verification

- [ ] `GET /api/games` on the deployed API returns 200 after rotation
- [ ] Old storage key no longer authenticates
- [ ] Azure SQL server rotated, and deleted if no longer wanted
- [ ] Previously issued JWTs are rejected with 401
- [ ] `grep -rI "AccountKey=" .` returns nothing in the working tree

---
*Maintained by paurodriguez0220 · Last updated: 2026-09-07*
*Standards: https://github.com/paurodriguez0220/standards-docs*
